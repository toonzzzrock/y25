/**
 * Forum Hub Search API Route
 * GET /api/forum/search?q=query
 * Returns forum threads matching the search query from the database
 */

import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim();

    if (!query || query.length < 2) {
      return NextResponse.json(
        { forums: [], error: 'Query must be at least 2 characters' },
        { status: 400 }
      );
    }

    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);

    const connection = await pool.getConnection();
    try {
      const likeValue = `%${query}%`;
      const [rows] = await connection.query(
        `SELECT f.thread_name, f.detail, f.created_at,
                cr.username AS creator_username,
                g.game_id, g.game_name,
                COUNT(r.comment_id) AS reply_count
         FROM forum f
         LEFT JOIN create_relation cr ON cr.thread_name = f.thread_name
         LEFT JOIN game g ON g.game_id = cr.game_id
         LEFT JOIN reply r ON r.thread_name = f.thread_name
         WHERE f.thread_name LIKE ?
            OR f.detail LIKE ?
         GROUP BY f.thread_name, f.detail, f.created_at, cr.username, g.game_id, g.game_name
         ORDER BY f.created_at DESC
         LIMIT ?`,
        [likeValue, likeValue, limit]
      );

      return NextResponse.json(
        { forums: rows || [] },
        { status: 200 }
      );
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error('Forum search error:', error);
    return NextResponse.json(
      { error: 'Failed to search forum hubs', forums: [] },
      { status: 500 }
    );
  }
}
