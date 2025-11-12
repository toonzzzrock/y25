/**
 * Games by Category API Route
 * GET /api/games/category/[categoryId]
 * Returns games matching the selected category
 */

import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
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
    console.log('[Category API] Resolving category', {
      categoryId,
      resolvedCategory: category.name,
      tagValue,
      limit,
      offset,
    });

    const connection = await pool.getConnection();
    try {
      let games: any[] = [];
      let total = 0;

      try {
        console.log('[Category API] Attempting tag lookup via tag join');
        const [rows] = await connection.query(
          `SELECT g.game_id as id, g.game_name as title, g.detail as description,
                  g.publisher_username as developer, g.link_to_file as image_url,
                  g.release_date, t.tag_name as genre
           FROM game g
           INNER JOIN tag t ON t.game_id = g.game_id
           WHERE t.tag_name = ? AND g.status = 'Approve'
           ORDER BY g.release_date DESC
           LIMIT ? OFFSET ?`,
          [tagValue, limit, offset]
        );

        games = rows as any[];

        const [countRows] = await connection.query(
          `SELECT COUNT(*) as total
           FROM tag t
           INNER JOIN game g ON t.game_id = g.game_id
           WHERE t.tag_name = ? AND g.status = 'Approve'`,
          [tagValue]
        );

        total = (countRows as any)[0]?.total || 0;
        console.log('[Category API] tag join success', {
          total,
          returned: games.length,
        });
      } catch (joinError: any) {
        console.log('[Category API] tag join failed, checking fallback', joinError?.code);
        if (joinError?.code !== 'ER_NO_SUCH_TABLE') {
          throw joinError;
        }

        try {
          console.log('[Category API] Attempting genre column fallback');
          const [rows] = await connection.query(
            `SELECT game_id as id, game_name as title, detail as description,
                    publisher_username as developer, link_to_file as image_url,
                    release_date, genre as genre
             FROM game
             WHERE genre = ? AND status = 'Approve'
             ORDER BY release_date DESC
             LIMIT ? OFFSET ?`,
            [tagValue, limit, offset]
          );

          games = rows as any[];

          const [countRows] = await connection.query(
            `SELECT COUNT(*) as total FROM game WHERE genre = ? AND status = 'Approve'`,
            [tagValue]
          );

          total = (countRows as any)[0]?.total || 0;
          console.log('[Category API] genre fallback success', {
            total,
            returned: games.length,
          });
        } catch (genreError: any) {
          console.log('[Category API] genre fallback failed, falling back to keyword search', genreError?.code);
          if (genreError?.code !== 'ER_BAD_FIELD_ERROR') {
            throw genreError;
          }

          const [rows] = await connection.query(
            `SELECT game_id as id, game_name as title, detail as description,
                    publisher_username as developer, link_to_file as image_url,
                    release_date, ? as genre
             FROM game
             WHERE (LOWER(game_name) LIKE ? OR LOWER(detail) LIKE ?) AND status = 'Approve'
             ORDER BY release_date DESC
             LIMIT ? OFFSET ?`,
            [tagValue, `%${tagValue.toLowerCase()}%`, `%${tagValue.toLowerCase()}%`, limit, offset]
          );

          games = rows as any[];

          const [countRows] = await connection.query(
            `SELECT COUNT(*) as total
             FROM game
             WHERE (LOWER(game_name) LIKE ? OR LOWER(detail) LIKE ?) AND status = 'Approve'`,
            [`%${tagValue.toLowerCase()}%`, `%${tagValue.toLowerCase()}%`]
          );

          total = (countRows as any)[0]?.total || 0;
          console.log('[Category API] keyword fallback results', {
            total,
            returned: games.length,
          });
        }
      }

      return NextResponse.json(
        {
          games: games || [],
          total,
          category: category.name,
          limit,
          offset
        },
        { status: 200 }
      );
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error('Category games fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch category games', games: [], total: 0 },
      { status: 500 }
    );
  }
}
