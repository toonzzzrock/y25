/**
 * Game Detail API Route
 * GET /api/games/[id]
 * Returns detailed information about a single game.
 */

import { NextRequest, NextResponse } from 'next/server';
import { callProcedure } from '@/lib/db';

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

    const rows = await callProcedure<any[]>('sp_get_game_detail', [parsedId]);
    const gameRow = Array.isArray(rows) && rows.length > 0 ? (rows[0] as Record<string, any>) : null;

    if (!gameRow) {
      return NextResponse.json(
        { error: 'Game not found', game: null },
        { status: 404 }
      );
    }

    const rawStatus = typeof gameRow.status === 'string' ? gameRow.status.trim().toLowerCase() : null;
    const isApproved = rawStatus === 'approve';

    if (!isApproved) {
      return NextResponse.json(
        { error: 'Game not available', game: null },
        { status: 404 }
      );
    }

    let resolvedPlayUrl: string | null =
      typeof gameRow.playUrl === 'string' && gameRow.playUrl.trim().length > 0
        ? gameRow.playUrl.trim()
        : null;

    const updateRows = await callProcedure<any[]>('sp_get_latest_game_update', [parsedId]);

    if (Array.isArray(updateRows) && updateRows.length > 0) {
      const latestLink = (updateRows[0] as Record<string, any>)?.link;
      if (typeof latestLink === 'string' && latestLink.trim().length > 0) {
        resolvedPlayUrl = latestLink.trim();
      }
    }

    if (!resolvedPlayUrl) {
      return NextResponse.json(
        { error: 'Game not available', game: null },
        { status: 404 }
      );
    }

    const game = {
      ...gameRow,
      playUrl: resolvedPlayUrl,
    };

    return NextResponse.json(
      { game },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Game detail fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch game', game: null },
      { status: 500 }
    );
  }
}
