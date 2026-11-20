// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockReadApiAccessToken = vi.fn();

vi.mock('./api-access-token', () => ({
  readApiAccessToken: (...args: unknown[]) => mockReadApiAccessToken(...args),
}));

import { proxyToBackend } from './backend-proxy';

const PORTAL_URL = 'http://portal.test/api/backend';

function upstreamReturns(response: Response) {
  const fetchMock = vi.fn().mockResolvedValue(response);
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('proxyToBackend', () => {
  beforeEach(() => {
    mockReadApiAccessToken.mockResolvedValue('server-side-jwt');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('forwards the server-side token, language, method, query and body to the API', async () => {
    const fetchMock = upstreamReturns(Response.json({ id: 'patient-1' }, { status: 201 }));
    const request = new Request(`${PORTAL_URL}/patients?page=2&limit=20`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept-Language': 'en', Cookie: 'authjs.session-token=x' },
      body: JSON.stringify({ firstName: 'Ana' }),
    });

    await proxyToBackend(request, ['patients']);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('http://localhost:4001/api/v1/patients?page=2&limit=20');
    expect(init.method).toBe('POST');
    expect(init.headers.get('Authorization')).toBe('Bearer server-side-jwt');
    expect(init.headers.get('Accept-Language')).toBe('en');
    expect(init.headers.get('Content-Type')).toBe('application/json');
    expect(init.headers.get('Cookie')).toBeNull();
    expect(new TextDecoder().decode(init.body)).toBe('{"firstName":"Ana"}');
  });

  it('relays status codes and error bodies unchanged', async () => {
    const errorBody = { statusCode: 409, message: 'El ejercicio está en uso por una rutina activa' };
    upstreamReturns(Response.json(errorBody, { status: 409 }));

    const response = await proxyToBackend(
      new Request(`${PORTAL_URL}/exercises/exercise-1`, { method: 'DELETE' }),
      ['exercises', 'exercise-1'],
    );

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual(errorBody);
  });

  it.each([401, 403, 404])('relays a %i from the API', async (status) => {
    upstreamReturns(Response.json({ statusCode: status, message: 'denied' }, { status }));

    const response = await proxyToBackend(new Request(`${PORTAL_URL}/patients/p`), ['patients', 'p']);

    expect(response.status).toBe(status);
    expect(await response.json()).toEqual({ statusCode: status, message: 'denied' });
  });

  it('relays an empty 204 without a body', async () => {
    upstreamReturns(new Response(null, { status: 204 }));

    const response = await proxyToBackend(
      new Request(`${PORTAL_URL}/routines/r`, { method: 'DELETE' }),
      ['routines', 'r'],
    );

    expect(response.status).toBe(204);
    expect(await response.text()).toBe('');
  });

  it('answers 401 without calling the API when the session has no usable token', async () => {
    mockReadApiAccessToken.mockResolvedValue(null);
    const fetchMock = upstreamReturns(Response.json({}));

    const response = await proxyToBackend(new Request(`${PORTAL_URL}/patients`), ['patients']);

    expect(response.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('answers 502 when the API cannot be reached', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed')));

    const response = await proxyToBackend(new Request(`${PORTAL_URL}/patients`), ['patients']);

    expect(response.status).toBe(502);
  });

  it('refuses path segments that would escape the API prefix', async () => {
    const fetchMock = upstreamReturns(Response.json({}));

    const response = await proxyToBackend(new Request(`${PORTAL_URL}/x`), ['..', 'auth', 'login']);

    expect(response.status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('never exposes the API token in the response sent to the browser', async () => {
    upstreamReturns(Response.json({ ok: true }, { headers: { 'set-cookie': 'leak=1', 'x-internal': 'y' } }));

    const response = await proxyToBackend(new Request(`${PORTAL_URL}/patients`), ['patients']);

    expect(response.headers.get('set-cookie')).toBeNull();
    expect(response.headers.get('x-internal')).toBeNull();
    expect(await response.text()).not.toContain('server-side-jwt');
  });
});
