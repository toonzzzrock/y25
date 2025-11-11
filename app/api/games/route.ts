/**
 * Games API Route
 * GET /api/games - Get all games
 * GET /api/games?limit=10&offset=0 - Paginated games
 */

import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    const connection = await pool.getConnection();
    try {
      // Get paginated games
      const [games] = await connection.query(
        `SELECT game_id as id, game_name as title, detail as description, 
                publisher_username as developer, link_to_file as image_url, 
                release_date
         FROM game 
         ORDER BY release_date DESC
         LIMIT ? OFFSET ?`,
        [limit, offset]
      );

      // Get total count
      const [countResult] = await connection.query(
        `SELECT COUNT(*) as total FROM game`
      );

      const total = (countResult as any)[0]?.total || 0;

      return NextResponse.json(
        { 
          games: games || [],
          total,
          limit,
          offset
        },
        { status: 200 }
      );
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error('Games fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch games', games: [], total: 0 },
      { status: 500 }
    );
  }
}
