import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware for route-level protection.
 * Protects /admin/* routes by checking for an auth_session cookie
 * that gets set on login and cleared on logout.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Admin route protection ──────────────────────────────────────────────
  if (pathname.startsWith('/admin')) {
    const sessionCookie = request.cookies.get('auth_session')?.value;

    if (!sessionCookie) {
      // No session cookie → redirect to login
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    try {
      const session = JSON.parse(sessionCookie);

      if (session.role !== 'admin') {
        // User is logged in but not an admin → redirect to home
        return NextResponse.redirect(new URL('/', request.url));
      }
    } catch {
      // Malformed cookie → clear it and redirect to login
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete('auth_session');
      return response;
    }
  }

  return NextResponse.next();
}

// Only run middleware on these routes
export const config = {
  matcher: ['/admin/:path*'],
};
