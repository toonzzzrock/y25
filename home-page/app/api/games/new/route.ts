/**
 * New Games API Route
 * GET /api/games/new - Get newest games sorted by release_date
 */

import { NextRequest, NextResponse } from 'next/server';
import { callProcedure } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    const games = await callProcedure<any[]>('sp_get_new_games', [limit, offset]);
    const countResult = await callProcedure<any[]>('sp_count_new_games');
    const total = Number(countResult?.[0]?.total ?? 0);

    return NextResponse.json(
      { 
        games: Array.isArray(games) ? games : [],
        total,
        limit,
        offset,
        timestamp: new Date().toISOString()
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('New games fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch new games', games: [] },
      { status: 500 }
    );
  }
}