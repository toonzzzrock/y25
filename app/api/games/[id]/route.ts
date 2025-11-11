/**
 * Game Detail API Route
 * GET /api/games/[id]
 * Returns detailed information about a single game.
 */

import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

type GameRouteContext =
  | { params: Promise<{ id: string }> }
  | { params: { id: string } };

async function extractGameId(context: GameRouteContext): Promise<string> {
  const params = await (context.params as any);
  const rawId: string | undefined = params?.id;

  if (!rawId) {
    return '';
  }

  try {
    return decodeURIComponent(rawId);
  } catch {
    return rawId;
  }
}

export async function GET(request: NextRequest, context: GameRouteContext) {
  try {
    const decodedId = await extractGameId(context);

    if (!decodedId) {
      return NextResponse.json(
        { error: 'Game id required', game: null },
        { status: 400 }
      );
    }

    const parsedId = Number(decodedId);

    if (!Number.isInteger(parsedId) || parsedId <= 0) {
      return NextResponse.json(
        { error: 'Invalid game id', game: null },
        { status: 400 }
      );
    }

    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        `SELECT game_id AS id,
                game_name AS title,
                detail AS description,
                publisher_username AS developer,
                link_to_file AS imageUrl,
                release_date AS releaseDate
         FROM game
         WHERE game_id = ?
         LIMIT 1`,
        [parsedId]
      );

      const game = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;

      if (!game) {
        return NextResponse.json(
          { error: 'Game not found', game: null },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { game },
        { status: 200 }
      );
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error('Game detail fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch game', game: null },
      { status: 500 }
    );
  }
}
