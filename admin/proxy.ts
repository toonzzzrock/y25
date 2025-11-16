import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const adminSessionCookie = request.cookies.get('admin_session');

  // Handle root path redirect to admin login
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  // Log API requests
  if (pathname.startsWith('/api/')) {
    try {
      console.log(`[Admin Middleware] API Request: ${request.method} ${pathname}`);
    } catch (error) {
      console.error('[Admin Middleware] Failed to track API request:', error);
    }
  }

  // Protect admin routes (except login)
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    if (!adminSessionCookie) {
      console.log(`[Admin Middleware] Unauthenticated access attempt to ${pathname}, redirecting to login`);
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    console.log(`[Admin Middleware] Authenticated access to ${pathname} by ${adminSessionCookie.value}`);
  }

  return NextResponse.next();
}

// Configure which routes to apply middleware to
export const config = {
  matcher: [
    // Protect admin routes and redirect root
    '/',
    '/admin/:path*',
    // Track API requests
    '/api/:path*',
  ],
};
