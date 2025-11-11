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
    const queryParam = searchParams.get('q');
    const trimmedQuery = queryParam?.trim() ?? '';
    const gameIdParam = searchParams.get('gameId');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);

    const hasQuery = trimmedQuery.length >= 2;
    const parsedGameId = gameIdParam ? Number(gameIdParam) : null;
    const hasGameFilter = parsedGameId !== null && Number.isInteger(parsedGameId) && parsedGameId > 0;

    if (gameIdParam && !hasGameFilter) {
      return NextResponse.json(
        { forums: [], error: 'Invalid game filter provided' },
        { status: 400 }
      );
    }

    if (!hasQuery && !hasGameFilter) {
      return NextResponse.json(
        { forums: [], error: 'Provide a search query or choose a game filter' },
        { status: 400 }
      );
    }

    const connection = await pool.getConnection();
    try {
      const filters: string[] = [];
      const params: Array<string | number> = [];

      if (hasQuery) {
        const likeValue = `%${trimmedQuery}%`;
        filters.push('(f.thread_name LIKE ? OR f.detail LIKE ? OR g.game_name LIKE ? OR cr.username LIKE ?)');
        params.push(likeValue, likeValue, likeValue, likeValue);
      }

      if (hasGameFilter && parsedGameId !== null) {
        filters.push('cr.game_id = ?');
        params.push(parsedGameId);
      }

      const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';

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
         ORDER BY f.created_at DESC
         LIMIT ?`,
        [...params, limit]
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
