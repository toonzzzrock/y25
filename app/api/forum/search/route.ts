/**
 * Forum Hub Search API Route
 * GET /api/forum/search?q=query
 * Returns forum threads matching the search query from the database
 */

import { NextRequest, NextResponse } from 'next/server';
import { callProcedure } from '@/lib/db';

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

    const rows = await callProcedure<any[]>('sp_search_forum_threads', [
      hasQuery ? `%${trimmedQuery}%` : null,
      hasGameFilter ? parsedGameId : null,
      limit,
    ]);

    return NextResponse.json(
      { forums: Array.isArray(rows) ? rows : [] },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Forum search error:', error);
    return NextResponse.json(
      { error: 'Failed to search forum hubs', forums: [] },
      { status: 500 }
    );
  }
}
