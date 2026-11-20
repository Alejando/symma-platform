// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { encode } from 'next-auth/jwt';

import { readApiAccessToken } from './api-access-token';

const SECRET = 'test-auth-secret-with-enough-length-1234';

function jwtExpiringIn(seconds: number): string {
  const payload = Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + seconds })).toString('base64');
  return `header.${payload}.signature`;
}

async function sessionCookie(name: string, accessToken: string): Promise<Headers> {
  const value = await encode({ token: { accessToken }, secret: SECRET, salt: name });
  return new Headers({ cookie: `${name}=${value}` });
}

describe('readApiAccessToken', () => {
  const originalSecret = process.env.AUTH_SECRET;

  beforeAll(() => {
    process.env.AUTH_SECRET = SECRET;
  });

  afterAll(() => {
    process.env.AUTH_SECRET = originalSecret;
  });

  it.each(['authjs.session-token', '__Secure-authjs.session-token'])(
    'reads the API token from the encrypted %s cookie',
    async (cookieName) => {
      const apiToken = jwtExpiringIn(3600);

      expect(await readApiAccessToken(await sessionCookie(cookieName, apiToken))).toBe(apiToken);
    },
  );

  it('returns null without a session cookie', async () => {
    expect(await readApiAccessToken(new Headers())).toBeNull();
  });

  it('returns null when the API token already expired', async () => {
    const headers = await sessionCookie('authjs.session-token', jwtExpiringIn(-60));

    expect(await readApiAccessToken(headers)).toBeNull();
  });

  it('ignores a bearer header sent by the browser', async () => {
    const headers = new Headers({ authorization: `Bearer ${jwtExpiringIn(3600)}` });

    expect(await readApiAccessToken(headers)).toBeNull();
  });
});
