import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Middleware runs in Edge Runtime - no Node.js modules allowed
  // Just pass through the request
  return NextResponse.next();
}

// Configure which routes to apply middleware to
export const config = {
  matcher: [
    // Match all API routes regardless of origin
    '/api/:path*',
  ],
};
