import { readApiAccessToken } from './api-access-token';
import { backendRequestHeaders, backendUrl } from './backend';

const METHODS_WITHOUT_BODY = new Set(['GET', 'HEAD']);
const STATUSES_WITHOUT_BODY = new Set([204, 205, 304]);

function isSafePathSegment(segment: string): boolean {
  return segment !== '' && segment !== '.' && segment !== '..';
}

function toBackendPath(segments: string[]): string | null {
  if (!segments.every(isSafePathSegment)) {
    return null;
  }
  return `/${segments.map(encodeURIComponent).join('/')}`;
}

function emptyResponse(status: number): Response {
  return Response.json({ statusCode: status }, { status });
}

async function forwardedBody(request: Request): Promise<ArrayBuffer | undefined> {
  if (METHODS_WITHOUT_BODY.has(request.method)) {
    return undefined;
  }
  const body = await request.arrayBuffer();
  return body.byteLength > 0 ? body : undefined;
}

async function relayResponse(upstream: Response): Promise<Response> {
  const headers = new Headers();
  const contentType = upstream.headers.get('content-type');
  if (contentType) {
    headers.set('content-type', contentType);
  }
  const body = STATUSES_WITHOUT_BODY.has(upstream.status) ? null : await upstream.arrayBuffer();
  return new Response(body, { status: upstream.status, headers });
}

export async function proxyToBackend(request: Request, pathSegments: string[]): Promise<Response> {
  const path = toBackendPath(pathSegments);
  if (!path) {
    return emptyResponse(404);
  }

  const accessToken = await readApiAccessToken(request.headers);
  if (!accessToken) {
    return emptyResponse(401);
  }

  const headers = backendRequestHeaders(accessToken, request.headers.get('accept-language'));
  const contentType = request.headers.get('content-type');
  if (contentType) {
    headers.set('Content-Type', contentType);
  }

  let upstream: Response;
  try {
    upstream = await fetch(backendUrl(path, new URL(request.url).search), {
      method: request.method,
      headers,
      body: await forwardedBody(request),
      cache: 'no-store',
    });
  } catch {
    return emptyResponse(502);
  }

  return relayResponse(upstream);
}
