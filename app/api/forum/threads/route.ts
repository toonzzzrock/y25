/**
 * Forum Threads API Route
 * GET /api/forum/threads
 * Returns all forum threads with creator and game metadata.
 */

import { NextRequest, NextResponse } from 'next/server';
import type { ResultSetHeader } from 'mysql2';
import { pool } from '@/lib/db';

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

    const connection = await pool.getConnection();
    try {
      const filters: string[] = [];
      const params: any[] = [];

      if (q && q.length >= 2) {
        filters.push('(f.thread_name LIKE ? OR f.detail LIKE ? OR g.game_name LIKE ? OR cr.username LIKE ?)');
        const likeValue = `%${q}%`;
        params.push(likeValue, likeValue, likeValue, likeValue);
      }

      if (cursorDate) {
        if (cursorThreadName) {
          filters.push('(f.created_at < ? OR (f.created_at = ? AND f.thread_name < ?))');
          params.push(cursorDate, cursorDate, cursorThreadName);
        } else {
          filters.push('f.created_at < ?');
          params.push(cursorDate);
        }
      }

      const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';
      const fetchLimit = Math.max(Math.min(limit, 100), 1) + 1;

      const [rows] = await connection.query(
        `SELECT f.thread_name, f.detail, f.created_at,
                cr.username AS creator_username,
                g.game_id, g.game_name,
                COUNT(r.comment_id) AS reply_count
         FROM forum f
         LEFT JOIN create_relation cr ON cr.thread_name = f.thread_name
         LEFT JOIN game g ON g.game_id = cr.game_id
         LEFT JOIN reply r ON r.thread_name = f.thread_name
         ${whereClause}
         GROUP BY f.thread_name, f.detail, f.created_at, cr.username, g.game_id, g.game_name
         ORDER BY f.created_at DESC, f.thread_name DESC
         LIMIT ?`,
        [...params, fetchLimit]
      );

  const rowsArray = Array.isArray(rows) ? (rows as any[]) : [];
      const hasMore = rowsArray.length > Math.min(fetchLimit - 1, 100);
      const trimmedThreads = hasMore ? rowsArray.slice(0, fetchLimit - 1) : rowsArray;
      const lastThread: any = hasMore && trimmedThreads.length > 0 ? trimmedThreads[trimmedThreads.length - 1] : null;
      let nextCursor: string | null = null;
      if (hasMore && lastThread?.created_at) {
        const cursorDate = new Date(lastThread.created_at);
        const threadName = typeof lastThread.thread_name === 'string' ? lastThread.thread_name : null;
        if (!Number.isNaN(cursorDate.getTime()) && threadName) {
          const payload = {
            createdAt: cursorDate.toISOString(),
            threadName,
          };
          nextCursor = Buffer.from(JSON.stringify(payload), 'utf-8').toString('base64');
        }
      }

      return NextResponse.json(
        { threads: trimmedThreads, hasMore, nextCursor },
        { status: 200 }
      );
    } finally {
      connection.release();
    }
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
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  let connection;

  try {
    const body = await request.json();
    const rawThreadName: unknown = body?.threadName;
    const rawDetail: unknown = body?.detail;
    const rawGameId: unknown = body?.gameId;

    if (typeof rawThreadName !== 'string' || rawThreadName.trim().length < 3) {
      return NextResponse.json(
        { error: 'Thread name must be at least 3 characters' },
        { status: 400 }
      );
    }

    const threadName = rawThreadName.trim();

    if (threadName.length > 70) {
      return NextResponse.json(
        { error: 'Thread name must be 70 characters or fewer' },
        { status: 400 }
      );
    }

    const detail = typeof rawDetail === 'string' && rawDetail.trim().length > 0 ? rawDetail.trim() : null;

    if (detail && detail.length > 255) {
      return NextResponse.json(
        { error: 'Detail must be 255 characters or fewer' },
        { status: 400 }
      );
    }

    const gameId = typeof rawGameId === 'number' ? rawGameId : rawGameId ? Number(rawGameId) : NaN;

    if (!Number.isInteger(gameId) || gameId <= 0) {
      return NextResponse.json(
        { error: 'Valid game is required' },
        { status: 400 }
      );
    }

    connection = await pool.getConnection();

    await connection.beginTransaction();

    const [existing] = await connection.query(
      'SELECT thread_name FROM forum WHERE thread_name = ? LIMIT 1',
      [threadName]
    );

    if (Array.isArray(existing) && existing.length > 0) {
      await connection.rollback();
      return NextResponse.json(
        { error: 'Thread name already exists' },
        { status: 409 }
      );
    }

    const [gameRows] = await connection.query(
      'SELECT game_id FROM game WHERE game_id = ? LIMIT 1',
      [gameId]
    );

    if (!Array.isArray(gameRows) || gameRows.length === 0) {
      await connection.rollback();
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      );
    }

    await connection.query<ResultSetHeader>(
      'INSERT INTO forum (thread_name, detail, created_at) VALUES (?, ?, NOW())',
      [threadName, detail]
    );

    await connection.query(
      'INSERT INTO create_relation (thread_name, username, game_id) VALUES (?, ?, ?)',
      [threadName, session.username, gameId]
    );

    const [rows] = await connection.query(
      `SELECT f.thread_name, f.detail, f.created_at,
              cr.username AS creator_username,
              g.game_id, g.game_name,
              COUNT(r.comment_id) AS reply_count
       FROM forum f
       LEFT JOIN create_relation cr ON cr.thread_name = f.thread_name
       LEFT JOIN game g ON g.game_id = cr.game_id
       LEFT JOIN reply r ON r.thread_name = f.thread_name
       WHERE f.thread_name = ?
       GROUP BY f.thread_name, f.detail, f.created_at, cr.username, g.game_id, g.game_name
       LIMIT 1`,
      [threadName]
    );

    await connection.commit();

    const thread = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;

    return NextResponse.json(
      { success: true, thread },
      { status: 201 }
    );
  } catch (error: any) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error('Thread creation rollback error:', rollbackError);
      }
    }

    console.error('Forum thread creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create thread' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
