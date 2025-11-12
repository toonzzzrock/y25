/**
 * Delete Game API Route
 * DELETE /api/games/delete
 * Allows publishers to delete their own games
 */

import { NextRequest, NextResponse } from 'next/server';
import type { PoolConnection } from 'mysql2/promise';
import { pool } from '@/lib/db';

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

    // First, verify that the game belongs to this publisher
    const [gameRows] = await connection.query(
      'SELECT game_id, game_name, publisher_username FROM game WHERE game_id = ? LIMIT 1',
      [gameId]
    );

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

    // Delete related records that don't have ON DELETE CASCADE
    // Note: We delete in order to avoid foreign key constraint errors
    
    // 1. Delete game update history
    await connection.query(
      'DELETE FROM game_update_history WHERE game_id = ?',
      [gameId]
    );

    // 2. Delete reports
    await connection.query(
      'DELETE FROM report WHERE game_id = ?',
      [gameId]
    );

    // 3. Delete create_relation records (forum thread connections)
    await connection.query(
      'DELETE FROM create_relation WHERE game_id = ?',
      [gameId]
    );

    // 4. Delete play records (user play statistics)
    await connection.query(
      'DELETE FROM play WHERE game_id = ?',
      [gameId]
    );

    // 5. Delete tag records (game categorization)
    await connection.query(
      'DELETE FROM tag WHERE game_id = ?',
      [gameId]
    );

    // 6. Now delete the game
    await connection.query(
      'DELETE FROM game WHERE game_id = ?',
      [gameId]
    );

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
