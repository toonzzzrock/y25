/**
 * Session Check API Route
 * GET /api/auth/session
 * Returns current user session information
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('auth_session')?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { authenticated: false, user: null },
        { status: 200 }
      );
    }

    try {
      // Decode session token
      const sessionData = JSON.parse(
        Buffer.from(sessionToken, 'base64').toString('utf-8')
      );

      // Check if session is expired (7 days)
      const sessionAge = Date.now() - sessionData.timestamp;
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

      if (sessionAge > maxAge) {
        return NextResponse.json(
          { authenticated: false, user: null, expired: true },
          { status: 200 }
        );
      }

      return NextResponse.json(
        {
          authenticated: true,
          user: {
            username: sessionData.username,
            email: sessionData.email,
            role: sessionData.role ?? 'user'
          }
        },
        { status: 200 }
      );
    } catch (error) {
      // Invalid session token
      return NextResponse.json(
        { authenticated: false, user: null },
        { status: 200 }
      );
    }
  } catch (error: any) {
    console.error('Session check error:', error);
    return NextResponse.json(
      { authenticated: false, user: null },
      { status: 200 }
    );
  }
}
