import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const authSessionCookie = request.cookies.get('auth_session');

  // Allow unauthenticated access to login and signup pages
  const publicRoutes = ['/', '/signup'];
  const isPublic = publicRoutes.some(route => pathname === route || pathname.startsWith(route + '/'));

  // Redirect authenticated users from login page to home
  if (pathname === '/' && authSessionCookie) {
    return NextResponse.redirect(new URL('/home', request.url));
  }

  // Log API requests
  if (pathname.startsWith('/api/')) {
    try {
      console.log(`[Home Middleware] API Request: ${request.method} ${pathname}`);
    } catch (error) {
      console.error('[Home Middleware] Failed to track API request:', error);
    }
  }

  // Redirect unauthenticated users to login page (except for public routes and API)
  if (!authSessionCookie && !isPublic && !pathname.startsWith('/api/')) {
    console.log(`[Home Middleware] Unauthenticated access attempt to ${pathname}, redirecting to login`);
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

// Configure which routes to apply middleware to
export const config = {
  matcher: [
    // Apply to all routes except static files
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
  ],
};
