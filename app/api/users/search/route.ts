/**
 * User Search API Route
 * GET /api/users/search?q=query
 * Returns users matching the search query from the database
 */

import { NextRequest, NextResponse } from 'next/server';
import { callProcedure } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim();

    if (!query || query.length < 2) {
      return NextResponse.json(
        { users: [], error: 'Query must be at least 2 characters' },
        { status: 400 }
      );
    }

    const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 25);
    const likePattern = `%${query}%`;

    const rows = await callProcedure<any[]>('sp_search_users', [likePattern]);
    const limitedRows = Array.isArray(rows) ? rows.slice(0, limit) : [];

    return NextResponse.json(
      { users: limitedRows },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('User search error:', error);
    return NextResponse.json(
      { error: 'Failed to search users', users: [] },
      { status: 500 }
    );
  }
}
