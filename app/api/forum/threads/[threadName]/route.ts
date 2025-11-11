/**
 * Forum Thread Detail API Route
 * GET /api/forum/threads/[threadName]
 * Returns a single forum thread with creator info and replies.
 */

import { NextRequest, NextResponse } from 'next/server';
import type { ResultSetHeader } from 'mysql2';
import { pool } from '@/lib/db';

type ThreadRouteContext =
  | { params: Promise<{ threadName: string }> }
  | { params: { threadName: string } };

async function extractThreadName(context: ThreadRouteContext): Promise<string> {
  const params = await (context.params as any);
  const rawName: string | undefined = params?.threadName;

  if (!rawName) {
    return '';
  }

  try {
    return decodeURIComponent(rawName);
  } catch {
    return rawName;
  }
}

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

export async function POST(request: NextRequest, context: ThreadRouteContext) {
  const decodedName = await extractThreadName(context);

  if (!decodedName) {
    return NextResponse.json(
      { error: 'Thread name required' },
      { status: 400 }
    );
  }

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
    const rawCommentText: unknown = body?.commentText;
    const replyToCommentIdRaw: unknown = body?.replyToCommentId;

    if (typeof rawCommentText !== 'string' || rawCommentText.trim().length === 0) {
      return NextResponse.json(
        { error: 'Comment text required' },
        { status: 400 }
      );
    }

    const commentText = rawCommentText.trim();

    if (commentText.length > 1500) {
      return NextResponse.json(
        { error: 'Comment text is too long' },
        { status: 400 }
      );
    }

    const replyToCommentId =
      typeof replyToCommentIdRaw === 'number' || typeof replyToCommentIdRaw === 'string'
        ? Number(replyToCommentIdRaw) || null
        : null;

    connection = await pool.getConnection();

    await connection.beginTransaction();

    const [threadRows] = await connection.query(
      'SELECT thread_name FROM forum WHERE thread_name = ? LIMIT 1',
      [decodedName]
    );

    if (!Array.isArray(threadRows) || threadRows.length === 0) {
      await connection.rollback();
      return NextResponse.json(
        { error: 'Thread not found' },
        { status: 404 }
      );
    }

    if (replyToCommentId !== null) {
      const [replyTarget] = await connection.query(
        'SELECT comment_id FROM reply WHERE comment_id = ? AND thread_name = ? LIMIT 1',
        [replyToCommentId, decodedName]
      );

      if (!Array.isArray(replyTarget) || replyTarget.length === 0) {
        await connection.rollback();
        return NextResponse.json(
          { error: 'Reply target not found' },
          { status: 404 }
        );
      }
    }

    const [commentResult] = await connection.query<ResultSetHeader>(
      'INSERT INTO comment (comment_text, created_at) VALUES (?, NOW())',
      [commentText]
    );

    const commentId = commentResult.insertId;

    await connection.query(
      'INSERT INTO reply (comment_id, reply_to_comment_id, thread_name, username) VALUES (?, ?, ?, ?)',
      [commentId, replyToCommentId, decodedName, session.username]
    );

    const [insertedRows] = await connection.query(
      `SELECT r.comment_id, r.reply_to_comment_id, r.username,
              CAST(c.comment_text AS CHAR) AS comment_text,
              c.created_at
       FROM reply r
       JOIN comment c ON c.comment_id = r.comment_id
       WHERE r.comment_id = ?
       LIMIT 1`,
      [commentId]
    );

    await connection.commit();

    const inserted = Array.isArray(insertedRows) && insertedRows.length > 0 ? (insertedRows as any)[0] : null;

    const createdAtValue = inserted?.created_at
      ? new Date(inserted.created_at).toISOString()
      : new Date().toISOString();

    const newComment = {
      commentId,
      replyToCommentId: inserted?.reply_to_comment_id ?? replyToCommentId ?? null,
      username: inserted?.username ?? session.username,
      commentText: inserted?.comment_text ?? commentText,
      createdAt: createdAtValue,
    };

    return NextResponse.json(
      { success: true, comment: newComment },
      { status: 201 }
    );
  } catch (error: any) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error('Rollback error:', rollbackError);
      }
    }

    console.error('Thread reply creation error:', error);
    return NextResponse.json(
      { error: 'Failed to post reply' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

export async function GET(
  request: NextRequest,
  context: ThreadRouteContext
) {
  try {
    const decodedName = await extractThreadName(context);

    if (!decodedName) {
      return NextResponse.json(
        { error: 'Thread name required' },
        { status: 400 }
      );
    }

    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        `SELECT f.thread_name, f.detail, f.created_at AS thread_created_at,
                cr.username AS creator_username,
                g.game_id, g.game_name,
                r.comment_id, r.reply_to_comment_id, r.username AS commenter_username,
                CAST(c.comment_text AS CHAR) AS comment_text,
                c.created_at AS comment_created_at
         FROM forum f
         LEFT JOIN create_relation cr ON cr.thread_name = f.thread_name
         LEFT JOIN game g ON g.game_id = cr.game_id
         LEFT JOIN reply r ON r.thread_name = f.thread_name
         LEFT JOIN comment c ON c.comment_id = r.comment_id
         WHERE f.thread_name = ?
         ORDER BY c.created_at ASC`,
        [decodedName]
      );

      if (!Array.isArray(rows) || rows.length === 0) {
        return NextResponse.json(
          { error: 'Thread not found', thread: null },
          { status: 404 }
        );
      }

      const baseRow = rows[0] as any;
      const comments = (rows as any[])
        .filter((row) => row.comment_id !== null)
        .map((row) => ({
          commentId: row.comment_id,
          replyToCommentId: row.reply_to_comment_id,
          username: row.commenter_username,
          commentText: row.comment_text,
          createdAt: row.comment_created_at,
        }));

      return NextResponse.json(
        {
          thread: {
            threadName: baseRow.thread_name,
            detail: baseRow.detail,
            createdAt: baseRow.thread_created_at,
            creatorUsername: baseRow.creator_username,
            gameId: baseRow.game_id,
            gameName: baseRow.game_name,
            comments,
          },
        },
        { status: 200 }
      );
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error('Forum thread detail error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch thread detail', thread: null },
      { status: 500 }
    );
  }
}
