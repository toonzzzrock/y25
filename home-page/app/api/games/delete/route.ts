/**
 * Delete Game API Route
 * DELETE /api/games/delete
 * Allows publishers to delete their own games
 */

import { NextRequest, NextResponse } from 'next/server';
import type { PoolConnection } from 'mysql2/promise';
import { pool, callProcedure } from '@/lib/db';

type SessionUser = {
  username: string;
  email?: string | null;
  role?: string | null;
};

function getSessionUser(request: NextRequest): SessionUser | null {
  const rawToken = request.cookies.get('auth_session')?.value;

  if (!rawToken) {
    return null;
  }

  try {
    const decoded = JSON.parse(Buffer.from(rawToken, 'base64').toString('utf-8'));
    if (!decoded?.username) {
      return null;
    }

    return {
      username: decoded.username,
      email: decoded.email ?? null,
      role: decoded.role ?? null,
    };
  } catch (error) {
    console.error('Delete game session parse error:', error);
    return null;
  }
}

export async function DELETE(request: NextRequest) {
  const session = getSessionUser(request);

  if (!session) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  let connection: PoolConnection | null = null;

  try {
    const body = await request.json();
    const { gameId } = body;

    if (!gameId) {
      return NextResponse.json(
        { error: 'Game ID is required' },
        { status: 400 }
      );
    }

    connection = await pool.getConnection();

    // First, verify that the game belongs to this publisher (via stored procedure)
    const gameRows: any[] = await callProcedure<any[]>('sp_get_game_owner', [gameId]);
    if (!Array.isArray(gameRows) || gameRows.length === 0) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      );
    }

    const game = gameRows[0] as any;

    // Check if the user is the publisher of this game
    if (game.publisher_username !== session.username) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this game' },
        { status: 403 }
      );
    }

    // Delegate cascade-safe deletion to stored procedure
    await callProcedure('sp_delete_game', [gameId]);

    return NextResponse.json(
      {
        success: true,
        message: `Game "${game.game_name}" has been deleted successfully`,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Delete game error:', error);
    return NextResponse.json(
      { error: 'Failed to delete game' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
