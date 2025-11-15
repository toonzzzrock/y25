import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const developerSessionCookie = request.cookies.get('developer_session');

  // Handle root path redirect to login
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/developer/login', request.url));
  }

  // Log API requests
  if (pathname.startsWith('/api/')) {
    try {
      console.log(`[Middleware] API Request: ${request.method} ${pathname}`);
    } catch (error) {
      console.error('[Middleware] Failed to track API request:', error);
    }
  }

  // Protect developer routes (except login)
  if (pathname.startsWith('/developer') && pathname !== '/developer/login') {
    if (!developerSessionCookie) {
      console.log(`[Middleware] Unauthenticated access attempt to ${pathname}, redirecting to login`);
      return NextResponse.redirect(new URL('/developer/login', request.url));
    }
    console.log(`[Middleware] Authenticated access to ${pathname} by ${developerSessionCookie.value}`);
  }

  return NextResponse.next();
}

// Configure which routes to apply middleware to
export const config = {
  matcher: [
    // Protect developer routes and redirect root
    '/',
    '/developer/:path*',
    // Track API requests
    '/api/:path*',
  ],
};
