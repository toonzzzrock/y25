/**
 * Games Search API Route
 * GET /api/games/search?q=query
 * Returns games matching the search query from the database
 */

import { NextRequest, NextResponse } from 'next/server';
import { callProcedure } from '@/lib/db';
import { getCategoryById } from '@/lib/data/categoriesUtils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim();

    if (!query || query.length < 2) {
      return NextResponse.json(
        { games: [], error: 'Query must be at least 2 characters' },
        { status: 400 }
      );
    }

    const categoryParam = searchParams.get('category')?.trim().toLowerCase();
    let tagValue: string | null = null;

    if (categoryParam && categoryParam !== 'all') {
      const category = getCategoryById(categoryParam);

      if (!category) {
        return NextResponse.json(
          { games: [], error: 'Invalid category' },
          { status: 400 }
        );
      }

      tagValue = category.tag;
    }

    const rows = await callProcedure<any[]>('sp_search_games', [
      `%${query}%`,
      tagValue,
    ]);

    return NextResponse.json(
      { games: Array.isArray(rows) ? rows : [] },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Failed to search games', games: [] },
      { status: 500 }
    );
  }
}
