const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';
const API_PREFIX = '/api/v1';

export function backendUrl(path: string, search = ''): string {
  return `${API_URL}${API_PREFIX}${path}${search}`;
}

export function backendRequestHeaders(accessToken: string, acceptLanguage: string | null): Headers {
  const headers = new Headers({ Authorization: `Bearer ${accessToken}` });
  if (acceptLanguage) {
    headers.set('Accept-Language', acceptLanguage);
  }
  return headers;
}
