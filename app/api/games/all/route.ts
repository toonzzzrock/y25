/**
 * All Games API Route  
 * GET /api/games/all - Get all approved games with pagination
 */

import { NextRequest, NextResponse } from 'next/server';
import { callProcedure } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    const games = await callProcedure<any[]>('sp_get_all_games', [limit, offset]);
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
    console.error('All games fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch all games', games: [] },
      { status: 500 }
    );
  }
}