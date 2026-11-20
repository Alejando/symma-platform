import { headers } from 'next/headers';
import { getLocale } from 'next-intl/server';
import type { DashboardStatsResponse } from '@symma/shared-types';

import { ApiError, AuthenticationError, throwIfNotOk } from '@/lib/errors';
import { readApiAccessToken } from './api-access-token';
import { backendRequestHeaders, backendUrl } from './backend';

const BAD_GATEWAY = 502;

async function fetchBackendAsCurrentUser(path: string): Promise<Response> {
  const accessToken = await readApiAccessToken(await headers());
  if (!accessToken) {
    throw new AuthenticationError();
  }

  const response = await fetch(backendUrl(path), {
    headers: backendRequestHeaders(accessToken, await getLocale()),
    cache: 'no-store',
  }).catch(() => {
    throw new ApiError(BAD_GATEWAY, '');
  });
  await throwIfNotOk(response);
  return response;
}

export async function getDashboardStatsForCurrentUser(): Promise<DashboardStatsResponse> {
  const response = await fetchBackendAsCurrentUser('/dashboard/stats');
  return response.json();
}
