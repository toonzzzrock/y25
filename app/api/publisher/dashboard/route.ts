import { NextRequest, NextResponse } from 'next/server';
import type { PoolConnection } from 'mysql2/promise';
import { pool } from '@/lib/db';

type SessionUser = {
  username: string;
  email?: string | null;
  role?: string | null;
};

type GameRecord = {
  id: number;
  title: string;
  description: string | null;
  bannerUrl: string | null;
  releaseDate: string | null;
  gameStatus: 'Approve' | 'Reject' | 'Pending';
  updateStatus: 'Approve' | 'Reject' | 'Pending' | null;
  patchNumber: string | null;
  metrics: {
    total_players: number | null;
    average_playtime: number | null;
  };
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
    console.error('Publisher dashboard session parse error:', error);
    return null;
  }
}



export async function GET(request: NextRequest) {
  const session = getSessionUser(request);

  if (!session) {
    return NextResponse.json(
      { error: 'Authentication required', publisher: null, publishedGames: [], submissions: [] },
      { status: 401 }
    );
  }

  let connection: PoolConnection | null = null;

  try {
    connection = await pool.getConnection();

    const [publisherRows] = await connection.query(
      'SELECT username, account_name FROM publisher WHERE username = ? LIMIT 1',
      [session.username]
    );

    if (!Array.isArray(publisherRows) || publisherRows.length === 0) {
      return NextResponse.json(
        { error: 'Publisher access required', publisher: null, publishedGames: [], submissions: [] },
        { status: 403 }
      );
    }

    const publisherRecord = publisherRows[0] as any;
    const accountName: string | null = publisherRecord?.account_name ?? null;

    const [gamesRows] = await connection.query(
      `SELECT 
         g.game_id, 
         g.game_name, 
         g.detail, 
         g.link_to_file, 
         g.release_date,
         g.status as game_status,
         g.total_players,
         g.average_play_time,
         guh.patch_number,
         guh.is_approve as update_status
       FROM game g
       LEFT JOIN game_update_history guh ON g.game_id = guh.game_id 
       WHERE g.publisher_username = ?
       ORDER BY g.release_date DESC, g.game_id DESC`,
      [session.username]
    );

    const games: GameRecord[] = Array.isArray(gamesRows)
      ? (gamesRows as any[]).map((row) => ({
          id: Number(row.game_id),
          title: row.game_name ?? 'Untitled Game',
          description: row.detail ?? null,
          bannerUrl: row.link_to_file ?? null,
          releaseDate: row.release_date ? new Date(row.release_date).toISOString() : null,
          gameStatus: row.game_status ?? 'Pending',
          updateStatus: row.update_status ? (row.update_status === true ? 'Approve' : row.update_status === false ? 'Pending' : row.update_status) : null,
          patchNumber: row.patch_number ?? null,
          metrics: {
            total_players: typeof row.total_players === 'number' ? row.total_players : null,
            average_playtime: typeof row.average_play_time === 'number' ? Math.round(row.average_play_time) : null,
          },
        }))
      : [];

    return NextResponse.json(
      {
        publisher: {
          username: session.username,
          accountName,
        },
        games,
        totalGames: games.length,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Publisher dashboard error:', error);
    return NextResponse.json(
      { error: 'Failed to load publisher dashboard', publisher: null, games: [], totalGames: 0 },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
