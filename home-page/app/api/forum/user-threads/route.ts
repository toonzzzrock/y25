/**
 * Forum User Threads API Route
 * GET /api/forum/user-threads
 * Returns threads created by and threads commented on by the authenticated user.
 */

import { NextRequest, NextResponse } from 'next/server';
import { callProcedure } from '@/lib/db';

function getSessionUser(request: NextRequest): { username: string; email?: string | null } | null {
  const token = request.cookies.get('auth_session')?.value;
  if (!token) {
    return null;
  }

  try {
    const session = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
    if (!session?.username) {
      return null;
    }

    return { username: session.username, email: session.email ?? null };
  } catch (error) {
    console.error('Session parse error:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  const session = getSessionUser(request);

  if (!session) {
    return NextResponse.json(
      { error: 'Authentication required', createdThreads: [], commentedThreads: [] },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const createdLimitRaw = parseInt(searchParams.get('createdLimit') || '5', 10);
    const commentedLimitRaw = parseInt(searchParams.get('commentedLimit') || '5', 10);

    const createdLimit = Math.min(Math.max(createdLimitRaw, 1), 25);
    const commentedLimit = Math.min(Math.max(commentedLimitRaw, 1), 25);

    const createdRows = await callProcedure<any[]>('sp_get_user_created_threads', [session.username]);
    const commentedRows = await callProcedure<any[]>('sp_get_user_commented_threads', [session.username]);

    return NextResponse.json(
      {
        createdThreads: Array.isArray(createdRows) ? createdRows.slice(0, createdLimit) : [],
        commentedThreads: Array.isArray(commentedRows) ? commentedRows.slice(0, commentedLimit) : [],
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('User threads fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to load user threads', createdThreads: [], commentedThreads: [] },
      { status: 500 }
    );
  }
}
