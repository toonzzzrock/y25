/**
 * Session Check API Route
 * GET /api/auth/session
 * Returns current user session information
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const rawSessionToken = request.cookies.get('auth_session')?.value;
  const tokenPreview = rawSessionToken
    ? `${rawSessionToken.slice(0, 8)}...(${rawSessionToken.length})`
    : 'none';

  try {
    if (!rawSessionToken) {
      console.info('[api/auth/session] No session cookie present.');
      return NextResponse.json(
        { authenticated: false, user: null },
        { status: 200 }
      );
    }

    try {
      // Decode session token
      const sessionData = JSON.parse(
        Buffer.from(rawSessionToken, 'base64').toString('utf-8')
      );

      // Check if session is expired (7 days)
      const sessionAge = Date.now() - sessionData.timestamp;
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

      if (sessionAge > maxAge) {
        console.info('[api/auth/session] Session cookie expired.', {
          token: tokenPreview,
          sessionTimestamp: sessionData.timestamp,
        });
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
      console.warn('[api/auth/session] Failed to decode session token.', {
        token: tokenPreview,
        error: error instanceof Error ? error.message : String(error),
      });
      return NextResponse.json(
        { authenticated: false, user: null },
        { status: 200 }
      );
    }
  } catch (error: any) {
    console.error('[api/auth/session] Unexpected error handling request.', {
      token: tokenPreview,
      error: error?.message || error,
      stack: error?.stack,
    });
    return NextResponse.json(
      { authenticated: false, user: null },
      { status: 200 }
    );
  }
}
