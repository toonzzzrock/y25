import { NextRequest, NextResponse } from 'next/server';
import type { PoolConnection } from 'mysql2/promise';
import { pool } from '@/lib/db';

type SessionUser = {
  username: string;
  email?: string | null;
  role?: string | null;
};

type PublishedGameRecord = {
  id: number;
  title: string;
  description: string | null;
  bannerUrl: string | null;
  releaseDate: string | null;
  metrics: {
    players: number | null;
    rating: number | null;
    comments: number | null;
    revenue: number | null;
  };
};

type SubmissionRecord = {
  id: number;
  title: string;
  status: 'waiting' | 'approved' | 'rejected';
  updatedAt: string | null;
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

function normalizeStatus(rawStatus: unknown): SubmissionRecord['status'] {
  const normalized = String(rawStatus ?? '').toLowerCase();

  if (normalized.includes('reject')) {
    return 'rejected';
  }
  if (normalized.includes('approve') || normalized.includes('accept')) {
    return 'approved';
  }
  if (normalized.includes('wait') || normalized.includes('pending') || normalized.includes('review')) {
    return 'waiting';
  }

  return 'waiting';
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

    const [publishedRows] = await connection.query(
      `SELECT game_id, game_name, detail, link_to_file, release_date
       FROM game
       WHERE publisher_username = ?
       ORDER BY release_date DESC, game_id DESC`,
      [session.username]
    );

    const publishedGames: PublishedGameRecord[] = Array.isArray(publishedRows)
      ? (publishedRows as any[]).map((row) => ({
          id: Number(row.game_id),
          title: row.game_name ?? 'Untitled Game',
          description: row.detail ?? null,
          bannerUrl: row.link_to_file ?? null,
          releaseDate: row.release_date ? new Date(row.release_date).toISOString() : null,
          metrics: {
            players: typeof row.player_count === 'number' ? row.player_count : null,
            rating: typeof row.average_rating === 'number' ? row.average_rating : null,
            comments: typeof row.comment_count === 'number' ? row.comment_count : null,
            revenue: typeof row.total_revenue === 'number' ? row.total_revenue : null,
          },
        }))
      : [];

    let submissions: SubmissionRecord[] = [];

    try {
      const [submissionRows] = await connection.query(
        `SELECT request_id, game_name, status, updated_at, created_at
         FROM game_submission
         WHERE publisher_username = ?
         ORDER BY COALESCE(updated_at, created_at) DESC`,
        [session.username]
      );

      submissions = Array.isArray(submissionRows)
        ? (submissionRows as any[]).map((row, index) => {
            const rawId =
              typeof row.request_id === 'number'
                ? row.request_id
                : row.request_id
                ? Number(row.request_id)
                : NaN;
            const resolvedId = Number.isFinite(rawId) ? Number(rawId) : index + 1;

            return {
              id: resolvedId,
              title: row.game_name ?? 'Untitled Game',
              status: normalizeStatus(row.status),
              updatedAt: row.updated_at
                ? new Date(row.updated_at).toISOString()
                : row.created_at
                ? new Date(row.created_at).toISOString()
                : null,
            };
          })
        : [];
    } catch (submissionError: any) {
      if (submissionError?.code !== 'ER_NO_SUCH_TABLE') {
        console.warn('Publisher submissions query failed:', submissionError);
      }
      submissions = [];
    }

    return NextResponse.json(
      {
        publisher: {
          username: session.username,
          accountName,
        },
        publishedGames,
        submissions,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Publisher dashboard error:', error);
    return NextResponse.json(
      { error: 'Failed to load publisher dashboard', publisher: null, publishedGames: [], submissions: [] },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
