import { proxyToBackend } from '@/lib/server/backend-proxy';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ path: string[] }> };

async function handle(request: Request, { params }: RouteContext): Promise<Response> {
  const { path } = await params;
  return proxyToBackend(request, path);
}

export { handle as GET, handle as POST, handle as PUT, handle as PATCH, handle as DELETE };
