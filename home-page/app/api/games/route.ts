/**
 * Games API Route
 * GET /api/games - Get all games
 * GET /api/games?limit=10&offset=0 - Paginated games
 */

import { NextRequest, NextResponse } from 'next/server';
import { callProcedure } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const publisherUsername = searchParams.get('publisher') || null;

    const games = await callProcedure<any[]>('sp_get_games_list', [publisherUsername, limit, offset]);
    const countResult = await callProcedure<any[]>('sp_count_games', [publisherUsername]);
    const total = Array.isArray(countResult) && countResult.length > 0 ? (countResult[0]?.total || 0) : 0;

    return NextResponse.json(
      { 
        games: games || [],
        total,
        limit,
        offset
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Games fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch games', games: [], total: 0 },
      { status: 500 }
    );
  }
}
