// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockReadApiAccessToken = vi.fn();
vi.mock('next/headers', () => ({ headers: async () => new Headers() }));
vi.mock('next-intl/server', () => ({ getLocale: async () => 'es' }));
vi.mock('./api-access-token', () => ({
  readApiAccessToken: (...args: unknown[]) => mockReadApiAccessToken(...args),
}));

import { ApiError, AuthenticationError } from '@/lib/errors';
import { getDashboardStatsForCurrentUser } from './api';

describe('getDashboardStatsForCurrentUser', () => {
  beforeEach(() => {
    mockReadApiAccessToken.mockResolvedValue('server-side-jwt');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('treats a session without a usable API token as expired', async () => {
    mockReadApiAccessToken.mockResolvedValue(null);

    await expect(getDashboardStatsForCurrentUser()).rejects.toBeInstanceOf(AuthenticationError);
  });

  it('treats an API token the API rejects as an expired session', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ statusCode: 401 }, { status: 401 })));

    await expect(getDashboardStatsForCurrentUser()).rejects.toBeInstanceOf(AuthenticationError);
  });

  it('reports an unreachable API as a server failure, not as the user being offline', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed')));

    const error = await getDashboardStatsForCurrentUser().catch((caught) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(502);
  });
});
