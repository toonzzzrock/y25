/**
 * Games by Category API Route
 * GET /api/games/category/[categoryId]
 * Returns games matching the selected category
 */

import { NextRequest, NextResponse } from 'next/server';
import { callProcedure } from '@/lib/db';
import { getCategoryById } from '@/lib/data/categoriesUtils';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ categoryId: string }> }
) {
  try {
    const { categoryId } = await context.params;

    if (!categoryId) {
      return NextResponse.json(
        { games: [], error: 'Category not provided' },
        { status: 400 }
      );
    }
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    const category = getCategoryById(categoryId.toLowerCase());

    if (!category) {
      return NextResponse.json(
        { games: [], error: 'Invalid category' },
        { status: 400 }
      );
    }

    const tagValue = category.tag;
    const games = await callProcedure<any[]>('sp_get_games_by_tag', [tagValue, limit, offset]);
    const countRows = await callProcedure<any[]>('sp_count_games_by_tag', [tagValue]);
    const total = Number(countRows?.[0]?.total ?? 0);

    return NextResponse.json(
      {
        games: Array.isArray(games) ? games : [],
        total,
        category: category.name,
        limit,
        offset,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Category games fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch category games', games: [], total: 0 },
      { status: 500 }
    );
  }
}
