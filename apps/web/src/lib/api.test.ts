import { afterEach, describe, expect, it, vi } from 'vitest';
import { deleteExercise, getAllExercises, getAllRoutineHistory, getPatient, getPatients, getRoutineHistory } from './api';
import { ApiError, AuthenticationError, NetworkError } from './errors';

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

    await expect(getPatient('patient-1')).rejects.toBeInstanceOf(AuthenticationError);
  });

  it('keeps 403 as a permission error instead of an expired session', async () => {
    stubFetchResponse(403, { message: 'Forbidden resource' });

    const error = await getPatient('patient-1').catch((caught) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).not.toBeInstanceOf(AuthenticationError);
    expect(error.status).toBe(403);
  });

  it('carries the message returned by the API', async () => {
    stubFetchResponse(409, { statusCode: 409, message: 'Exercise is used by an active routine' });

    const error = await deleteExercise('exercise-1').catch((caught) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(409);
    expect(error.message).toBe('Exercise is used by an active routine');
  });

  it('reports an unreachable portal as a network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    await expect(getPatient('patient-1')).rejects.toBeInstanceOf(NetworkError);
  });

  it('keeps a malformed history response from looking like a network error', async () => {
    stubFetchResponse(200, [{ id: 'session-1' }]);

    const error = await getAllRoutineHistory('routine-1').catch((caught) => caught);

    expect(error).not.toBeInstanceOf(NetworkError);
  });

  it('joins validation messages returned as a list', async () => {
    stubFetchResponse(400, { message: ['limit must be a number', 'page must be positive'] });

    await expect(getPatient('patient-1')).rejects.toThrow('limit must be a number. page must be positive');
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

    await getPatient('patient-1');

    expect(fetchMock.mock.calls[0][1].headers['Accept-Language']).toBe('en');
  });
});

describe('API access through the portal server', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('calls the same-origin proxy without any bearer token', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: 'patient-1' })));
    vi.stubGlobal('fetch', fetchMock);

    await getPatient('patient-1');

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/backend/patients/patient-1');
    expect(init.credentials).toBe('same-origin');
    expect(init.headers).not.toHaveProperty('Authorization');
  });

  it('accepts an empty 204 body on deletes', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })));

    await expect(deleteExercise('exercise-1')).resolves.toBeUndefined();
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

    const result = await getPatients({ page: 3, limit: 20, search: 'ana' });

    const requestedUrl = new URL(fetchMock.mock.calls[0][0], 'http://portal.test');
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

    const exercises = await getAllExercises();

    expect(exercises).toHaveLength(101);
    expect(new URL(fetchMock.mock.calls[1][0], 'http://portal.test').searchParams.get('page')).toBe('2');
  });
});

describe('routine session history', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('requests one page of the history with page and limit', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: [], total: 0, page: 2, limit: 20 })),
    );
    vi.stubGlobal('fetch', fetchMock);

    await getRoutineHistory('routine-1', { page: 2, limit: 20 });

    expect(fetchMock.mock.calls[0][0]).toBe('/api/backend/routines/routine-1/history?page=2&limit=20');
  });

  it('walks every page to collect the whole history for the evolution chart', async () => {
    const firstPage = Array.from({ length: 100 }, (_, index) => ({ id: `session-${index}` }));
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: firstPage, total: 101, page: 1, limit: 100 })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: [{ id: 'session-100' }], total: 101, page: 2, limit: 100 })));
    vi.stubGlobal('fetch', fetchMock);

    const sessions = await getAllRoutineHistory('routine-1');

    expect(sessions).toHaveLength(101);
    expect(fetchMock.mock.calls[1][0]).toBe('/api/backend/routines/routine-1/history?page=2&limit=100');
  });
});
