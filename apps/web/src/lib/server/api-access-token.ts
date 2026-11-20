import { getToken, type JWT } from 'next-auth/jwt';

import { isTokenExpired } from '@/lib/auth-utils';

type HeadersSource = Headers | Iterable<[string, string]>;

async function decodeSessionToken(headers: Headers, secureCookie: boolean): Promise<JWT | null> {
  return getToken({ req: { headers }, secret: process.env.AUTH_SECRET, secureCookie });
}

function usableAccessToken(sessionToken: JWT | null): string | null {
  const accessToken = sessionToken?.accessToken;
  if (!accessToken || sessionToken.error === 'TokenExpired' || isTokenExpired(accessToken)) {
    return null;
  }
  return accessToken;
}

/**
 * The API token lives only inside the encrypted, httpOnly session cookie and is read here on the
 * server; it is never copied into the session object that reaches the browser.
 */
export async function readApiAccessToken(source: HeadersSource): Promise<string | null> {
  const incoming = source instanceof Headers ? source : new Headers([...source]);
  const headers = new Headers({ cookie: incoming.get('cookie') ?? '' });
  const sessionToken =
    (await decodeSessionToken(headers, true)) ?? (await decodeSessionToken(headers, false));
  return usableAccessToken(sessionToken);
}
