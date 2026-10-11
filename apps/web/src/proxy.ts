import { NextResponse, type NextRequest } from 'next/server';

const SESSION_COOKIE = 'ds_session';

/**
 * Fast redirect for signed-out visitors to /admin pages. This only checks that a session
 * cookie exists; the admin layout verifies the session with the API on every request.
 */
export function proxy(request: NextRequest) {
  if (request.cookies.has(SESSION_COOKIE)) return NextResponse.next();
  const url = request.nextUrl.clone();
  url.pathname = '/admin/login';
  url.search = '';
  if (request.nextUrl.pathname !== '/admin') url.searchParams.set('next', request.nextUrl.pathname);
  return NextResponse.redirect(url);
}

export const config = {
  // Every /admin page except the login page. API routes are never matched here, so
  // uploads proxied through /api are not subject to proxy body-size limits.
  matcher: ['/admin', '/admin/((?!login).*)'],
};
