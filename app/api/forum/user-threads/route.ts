/**
 * Forum User Threads API Route
 * GET /api/forum/user-threads
 * Returns threads created by and threads commented on by the authenticated user.
 */

import { NextRequest, NextResponse } from 'next/server';
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

    const connection = await pool.getConnection();
    try {
      const [createdRows] = await connection.query(
        `SELECT f.thread_name, f.detail, f.created_at,
                cr.username AS creator_username,
                g.game_id, g.game_name,
                COALESCE(reply_counts.reply_count, 0) AS reply_count
         FROM create_relation cr
         JOIN forum f ON f.thread_name = cr.thread_name
         LEFT JOIN game g ON g.game_id = cr.game_id
         LEFT JOIN (
           SELECT thread_name, COUNT(*) AS reply_count
           FROM reply
           GROUP BY thread_name
         ) AS reply_counts ON reply_counts.thread_name = f.thread_name
         WHERE cr.username = ?
         ORDER BY f.created_at DESC, f.thread_name DESC
         LIMIT ?`,
        [session.username, createdLimit]
      );

      const [commentedRows] = await connection.query(
        `SELECT
            f.thread_name,
            f.detail,
            f.created_at,
            cr.username AS creator_username,
            g.game_id,
            g.game_name,
            COALESCE(reply_counts.reply_count, 0) AS reply_count
         FROM (
           SELECT r.thread_name, MAX(c.created_at) AS last_commented_at
           FROM reply r
           JOIN comment c ON c.comment_id = r.comment_id
           WHERE r.username = ?
           GROUP BY r.thread_name
           ORDER BY last_commented_at DESC
           LIMIT ?
         ) AS user_activity
         JOIN forum f ON f.thread_name = user_activity.thread_name
         LEFT JOIN create_relation cr ON cr.thread_name = f.thread_name
         LEFT JOIN game g ON g.game_id = cr.game_id
         LEFT JOIN (
           SELECT thread_name, COUNT(*) AS reply_count
           FROM reply
           GROUP BY thread_name
         ) AS reply_counts ON reply_counts.thread_name = f.thread_name
         ORDER BY user_activity.last_commented_at DESC, f.thread_name DESC`,
        [session.username, commentedLimit]
      );

      return NextResponse.json(
        {
          createdThreads: Array.isArray(createdRows) ? createdRows : [],
          commentedThreads: Array.isArray(commentedRows) ? commentedRows : [],
        },
        { status: 200 }
      );
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error('User threads fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to load user threads', createdThreads: [], commentedThreads: [] },
      { status: 500 }
    );
  }
}
