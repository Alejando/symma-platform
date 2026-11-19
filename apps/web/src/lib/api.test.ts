import { afterEach, describe, expect, it, vi } from 'vitest';
import { deleteExercise, getAllExercises, getPatient, getPatients } from './api';
import { ApiError, AuthenticationError } from './errors';

function stubFetchResponse(status: number, body: unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status })),
  );
}

describe('API client error mapping', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('treats 401 as an expired session', async () => {
    stubFetchResponse(401, { message: 'Unauthorized' });

    await expect(getPatient('token', 'patient-1')).rejects.toBeInstanceOf(AuthenticationError);
  });

  it('keeps 403 as a permission error instead of an expired session', async () => {
    stubFetchResponse(403, { message: 'Forbidden resource' });

    const error = await getPatient('token', 'patient-1').catch((caught) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).not.toBeInstanceOf(AuthenticationError);
    expect(error.status).toBe(403);
  });

  it('carries the message returned by the API', async () => {
    stubFetchResponse(409, { statusCode: 409, message: 'Exercise is used by an active routine' });

    const error = await deleteExercise('token', 'exercise-1').catch((caught) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(409);
    expect(error.message).toBe('Exercise is used by an active routine');
  });

  it('joins validation messages returned as a list', async () => {
    stubFetchResponse(400, { message: ['limit must be a number', 'page must be positive'] });

    await expect(getPatient('token', 'patient-1')).rejects.toThrow('limit must be a number. page must be positive');
  });
});

describe('request language', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    document.documentElement.lang = '';
  });

  it('asks the API to answer in the language the portal is shown in', async () => {
    document.documentElement.lang = 'en';
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: 'patient-1' })));
    vi.stubGlobal('fetch', fetchMock);

    await getPatient('token', 'patient-1');

    expect(fetchMock.mock.calls[0][1].headers['Accept-Language']).toBe('en');
  });
});

describe('paginated lists', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('requests the given page and page size', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: [], total: 45, page: 3, limit: 20 }), { status: 200 }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await getPatients('token', { page: 3, limit: 20, search: 'ana' });

    const requestedUrl = new URL(fetchMock.mock.calls[0][0]);
    expect(requestedUrl.searchParams.get('page')).toBe('3');
    expect(requestedUrl.searchParams.get('limit')).toBe('20');
    expect(requestedUrl.searchParams.get('search')).toBe('ana');
    expect(result.total).toBe(45);
  });

  it('walks every page to load the whole exercise catalog', async () => {
    const firstPage = Array.from({ length: 100 }, (_, index) => ({ id: `exercise-${index}` }));
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: firstPage, total: 101, page: 1, limit: 100 })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: [{ id: 'exercise-100' }], total: 101, page: 2, limit: 100 })));
    vi.stubGlobal('fetch', fetchMock);

    const exercises = await getAllExercises('token');

    expect(exercises).toHaveLength(101);
    expect(new URL(fetchMock.mock.calls[1][0]).searchParams.get('page')).toBe('2');
  });
});
