/**
 * Games Search API Route
 * GET /api/games/search?q=query
 * Returns games matching the search query from the database
 */

import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
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
    let tagValue: string | undefined;

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

    const connection = await pool.getConnection();
    try {
      const likeParams = [`%${query}%`, `%${query}%`, `%${query}%`];
      let games: any[] = [];

      try {
        const joinClause = tagValue ? 'INNER JOIN tag t ON t.game_id = g.game_id' : 'LEFT JOIN tag t ON t.game_id = g.game_id';
        const tagFilterClause = tagValue ? 'AND t.tag_name = ?' : '';
        const params = tagValue ? [...likeParams, tagValue] : likeParams;

        const [rows] = await connection.query(
          `SELECT DISTINCT g.game_id as id, g.game_name as title, g.detail as description,
                  g.publisher_username as developer, g.link_to_file as image_url,
                  g.release_date, t.tag_name as genre
           FROM game g
           ${joinClause}
           WHERE (g.game_name LIKE ? OR g.detail LIKE ? OR g.publisher_username LIKE ?)
           ${tagFilterClause}
           ORDER BY g.release_date DESC
           LIMIT 20`,
          params
        );

        games = rows as any[];
      } catch (joinError: any) {
        if (joinError?.code !== 'ER_NO_SUCH_TABLE') {
          throw joinError;
        }

        if (tagValue) {
          try {
            const [rows] = await connection.query(
              `SELECT game_id as id, game_name as title, detail as description,
                      publisher_username as developer, link_to_file as image_url,
                      release_date, genre as genre
               FROM game
               WHERE genre = ?
                 AND (game_name LIKE ? OR detail LIKE ? OR publisher_username LIKE ?)
               ORDER BY release_date DESC
               LIMIT 20`,
              [tagValue, ...likeParams]
            );

            games = rows as any[];
          } catch (genreError: any) {
            if (genreError?.code !== 'ER_BAD_FIELD_ERROR') {
              throw genreError;
            }

            const lowerTag = `%${tagValue.toLowerCase()}%`;
            const [rows] = await connection.query(
              `SELECT game_id as id, game_name as title, detail as description,
                      publisher_username as developer, link_to_file as image_url,
                      release_date, ? as genre
               FROM game
               WHERE (game_name LIKE ? OR detail LIKE ? OR publisher_username LIKE ?)
                 AND (LOWER(game_name) LIKE ? OR LOWER(detail) LIKE ?)
               ORDER BY release_date DESC
               LIMIT 20`,
              [tagValue, ...likeParams, lowerTag, lowerTag]
            );

            games = rows as any[];
          }
        } else {
          const [rows] = await connection.query(
            `SELECT game_id as id, game_name as title, detail as description,
                    publisher_username as developer, link_to_file as image_url,
                    release_date, NULL as genre
             FROM game
             WHERE game_name LIKE ? OR detail LIKE ? OR publisher_username LIKE ?
             ORDER BY release_date DESC
             LIMIT 20`,
            likeParams
          );

          games = rows as any[];
        }
      }

      return NextResponse.json(
        { games: games || [] },
        { status: 200 }
      );
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Failed to search games', games: [] },
      { status: 500 }
    );
  }
}
