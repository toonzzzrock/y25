/**
 * Forum Threads API Route
 * GET /api/forum/threads
 * Returns all forum threads with creator and game metadata.
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
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
    const q = searchParams.get('q')?.trim();
    const cursorRaw = searchParams.get('cursor');
    let cursorDate: Date | null = null;
    let cursorThreadName: string | null = null;

    if (cursorRaw) {
      try {
        const decodedPayload = JSON.parse(Buffer.from(cursorRaw, 'base64').toString('utf-8'));
        if (decodedPayload?.createdAt) {
          const parsed = new Date(decodedPayload.createdAt);
          if (!Number.isNaN(parsed.getTime())) {
            cursorDate = parsed;
          }
        }
        if (typeof decodedPayload?.threadName === 'string' && decodedPayload.threadName.trim().length > 0) {
          cursorThreadName = decodedPayload.threadName;
        }
      } catch (error) {
        const parsed = new Date(cursorRaw);
        if (!Number.isNaN(parsed.getTime())) {
          cursorDate = parsed;
        }
      }
    }

    const fetchLimit = Math.max(Math.min(limit, 100), 1) + 1;
    const searchPattern = q && q.length >= 2 ? `%${q}%` : null;
    const cursorCreatedValue = cursorDate
      ? cursorDate.toISOString().slice(0, 19).replace('T', ' ')
      : null;
    const rows = await callProcedure<any[]>('sp_get_forum_threads_cursor', [
      fetchLimit,
      cursorCreatedValue,
      cursorThreadName,
      searchPattern,
    ]);

    const rowsArray = Array.isArray(rows) ? rows : [];
    const hasMore = rowsArray.length > fetchLimit - 1;
    const trimmedThreads = hasMore ? rowsArray.slice(0, fetchLimit - 1) : rowsArray;
    const lastThread: any = hasMore && trimmedThreads.length > 0 ? trimmedThreads[trimmedThreads.length - 1] : null;
    let nextCursor: string | null = null;
    if (hasMore && lastThread?.created_at) {
      const cursorDateValue = new Date(lastThread.created_at);
      const threadName = typeof lastThread.thread_name === 'string' ? lastThread.thread_name : null;
      if (!Number.isNaN(cursorDateValue.getTime()) && threadName) {
        const payload = {
          createdAt: cursorDateValue.toISOString(),
          threadName,
        };
        nextCursor = Buffer.from(JSON.stringify(payload), 'utf-8').toString('base64');
      }
    }

    return NextResponse.json(
      { threads: trimmedThreads, hasMore, nextCursor },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Forum threads fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch forum threads', threads: [] },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = getSessionUser(request);
  if (!session) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const rawThreadName: unknown = body?.threadName;
    const rawDetail: unknown = body?.detail;
    const rawGameId: unknown = body?.gameId;

    if (typeof rawThreadName !== 'string' || rawThreadName.trim().length < 3) {
      return NextResponse.json({ error: 'Thread name must be at least 3 characters' }, { status: 400 });
    }

    const threadName = rawThreadName.trim();
    if (threadName.length > 70) {
      return NextResponse.json({ error: 'Thread name must be 70 characters or fewer' }, { status: 400 });
    }

    const detail = typeof rawDetail === 'string' && rawDetail.trim().length > 0 ? rawDetail.trim() : null;
    if (detail && detail.length > 255) {
      return NextResponse.json({ error: 'Detail must be 255 characters or fewer' }, { status: 400 });
    }

    const gameId = typeof rawGameId === 'number' ? rawGameId : rawGameId ? Number(rawGameId) : NaN;
    if (!Number.isInteger(gameId) || gameId <= 0) {
      return NextResponse.json({ error: 'Valid game is required' }, { status: 400 });
    }

    const existing = await callProcedure<any[]>('sp_check_thread_exists', [threadName]);
    if (Array.isArray(existing) && existing.length > 0) {
      return NextResponse.json({ error: 'Thread name already exists' }, { status: 409 });
    }

    const gameRows = await callProcedure<any[]>('sp_check_game_for_thread', [gameId]);
    if (!Array.isArray(gameRows) || gameRows.length === 0) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    await callProcedure('sp_create_forum_thread', [threadName, detail, session.username, gameId]);

    return NextResponse.json({ message: 'Thread created successfully' }, { status: 201 });
  } catch (error: any) {
    console.error('Forum thread creation error:', error);
    return NextResponse.json({ error: 'Failed to create thread' }, { status: 500 });
  }
}
