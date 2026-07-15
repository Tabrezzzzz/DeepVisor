import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from './lib/server/supabase/proxy';

function resolveRequestId(request: NextRequest): string {
  const existing =
    request.headers.get('x-request-id') ||
    request.headers.get('x-correlation-id') ||
    request.headers.get('traceparent');

  if (existing?.trim()) {
    return existing.trim().slice(0, 128);
  }

  return crypto.randomUUID();
}

function passApiRequest(request: NextRequest, requestId: string) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-request-id', requestId);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  response.headers.set('x-request-id', requestId);
  return response;
}

export async function proxy(request: NextRequest) {
  const requestId = resolveRequestId(request);

  if (request.nextUrl.pathname.startsWith('/api/')) {
    return passApiRequest(request, requestId);
  }

  return await updateSession(request, requestId)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Specific asset file types like .svg, .png, etc.
     */
    "/((?!_next/|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map)$).*)",
  ],
};
