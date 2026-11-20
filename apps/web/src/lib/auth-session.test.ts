import { describe, expect, it } from 'vitest';
import type { Session } from 'next-auth';

import { storeApiCredentials, toClientSession } from './auth-session';

function jwtExpiringIn(seconds: number): string {
  const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + seconds }));
  return `header.${payload}.signature`;
}

const API_TOKEN = jwtExpiringIn(3600);

const signedInUser = {
  id: 'therapist-1',
  email: 'ana@clinic.test',
  name: 'Ana Pérez',
  accessToken: API_TOKEN,
  role: 'THERAPIST',
};

const defaultSession = {
  user: { name: 'Ana Pérez', email: 'ana@clinic.test', image: null },
  expires: '2026-12-01T00:00:00.000Z',
} as unknown as Session;

describe('client session', () => {
  it('keeps the API token in the encrypted server-side token', () => {
    const token = storeApiCredentials({}, signedInUser);

    expect(token.accessToken).toBe(API_TOKEN);
  });

  it('never carries the API token to the browser', () => {
    const token = storeApiCredentials({}, signedInUser);

    const clientSession = toClientSession(defaultSession, token);

    expect(JSON.stringify(clientSession)).not.toContain(API_TOKEN);
    expect(clientSession.user).not.toHaveProperty('accessToken');
    expect(clientSession.user).toEqual({
      id: 'therapist-1',
      name: 'Ana Pérez',
      email: 'ana@clinic.test',
      role: 'THERAPIST',
    });
  });

  it('flags an expired API token so the portal signs the user out', () => {
    const token = storeApiCredentials({}, { ...signedInUser, accessToken: jwtExpiringIn(-60) });

    expect(toClientSession(defaultSession, token).error).toBe('TokenExpired');
  });
});
