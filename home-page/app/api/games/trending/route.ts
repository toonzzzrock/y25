/**
 * Trending Games API Route
 * GET /api/games/trending - Get trending games sorted by total_players
 */

import { NextRequest, NextResponse } from 'next/server';
import { callProcedure } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);

    const games = await callProcedure('sp_get_trending_games', [limit]);
    return NextResponse.json(
      {
        games: Array.isArray(games) ? games : [],
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Trending games fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trending games', games: [] },
      { status: 500 }
    );
  }
}