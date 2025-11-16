import { NextRequest, NextResponse } from 'next/server';
import { callProcedure } from '@/lib/db';

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

  try {
    const publisherRows = await callProcedure<any[]>('sp_get_publisher_info', [session.username]);

    if (!Array.isArray(publisherRows) || publisherRows.length === 0) {
      return NextResponse.json(
        { error: 'Publisher access required', publisher: null, publishedGames: [], submissions: [] },
        { status: 403 }
      );
    }

    const publisherRecord = Array.isArray(publisherRows) && publisherRows.length > 0 ? publisherRows[0] : null;
    const accountName: string | null = publisherRecord?.account_name ?? null;

    const gamesRows = await callProcedure<any[]>('sp_get_publisher_games', [session.username]);

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
  }
}
