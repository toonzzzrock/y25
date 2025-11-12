/**
 * Trending Games API Route
 * GET /api/games/trending - Get trending games sorted by total_players
 */

import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);

    const connection = await pool.getConnection();
    
    try {
      // Get trending games sorted by total_players (descending)
      const [games] = await connection.query(
        `SELECT game_id as id, 
                game_name as title, 
                detail as description,
                publisher_username as developer, 
                link_to_file as image_url,
                release_date,
                total_players
         FROM game
         WHERE status = 'Approve' AND total_players > 0
         ORDER BY total_players DESC, release_date DESC
         LIMIT ?`,
        [limit]
      );

      return NextResponse.json(
        { 
          games: games || [],
          timestamp: new Date().toISOString()
        },
        { status: 200 }
      );
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error('Trending games fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trending games', games: [] },
      { status: 500 }
    );
  }
}