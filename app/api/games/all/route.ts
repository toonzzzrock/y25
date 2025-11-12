/**
 * All Games API Route  
 * GET /api/games/all - Get all approved games with pagination
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
      // Get all approved games with pagination
      const [games] = await connection.query(
        `SELECT game_id as id, 
                game_name as title, 
                detail as description,
                publisher_username as developer, 
                link_to_file as image_url,
                release_date,
                total_players
         FROM game
         WHERE status = 'Approve'
         ORDER BY game_name ASC, game_id DESC
         LIMIT ? OFFSET ?`,
        [limit, offset]
      );

      // Get total count for pagination
      const [countResult] = await connection.query(
        `SELECT COUNT(*) as total FROM game WHERE status = 'Approve'`
      );

      const total = (countResult as any)[0]?.total || 0;

      return NextResponse.json(
        { 
          games: games || [],
          total,
          limit,
          offset,
          timestamp: new Date().toISOString()
        },
        { status: 200 }
      );
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error('All games fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch all games', games: [] },
      { status: 500 }
    );
  }
}