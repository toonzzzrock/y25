import { NextRequest, NextResponse } from 'next/server';
import type { PoolConnection } from 'mysql2/promise';
import { pool } from '@/lib/db';

interface SessionUser {
  username: string;
  role?: string | null;
}

interface ReportRecord {
  id: number;
  gameId: number;
  gameName: string;
  reporter: string;
  topic: string;
  detail: string;
  reportedAt: string;
}

function parseSession(request: NextRequest): SessionUser | null {
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
      role: decoded.role ?? null,
    };
  } catch (error) {
    console.error('Publisher reports session parse error:', error);
    return null;
  }
}

function normalizeReportRow(row: any, fallbackId: number): ReportRecord {
  const rawId = row?.report_id ?? row?.id ?? fallbackId;
  const resolvedId = Number.isFinite(Number(rawId)) ? Number(rawId) : fallbackId;
  const rawGameId = row?.game_id ?? row?.gameId;
  const gameId = Number.isFinite(Number(rawGameId)) ? Number(rawGameId) : 0;

  return {
    id: resolvedId,
    gameId,
    gameName: typeof row?.game_name === 'string' ? row.game_name : row?.title ?? `Game ${gameId || resolvedId}`,
    reporter: row?.username ?? row?.reporter ?? 'Unknown',
    topic: row?.report_topic ?? row?.topic ?? 'General',
    detail: row?.detail ?? '',
    reportedAt: row?.report_time ? new Date(row.report_time).toISOString() : new Date().toISOString(),
  };
}

export async function GET(request: NextRequest) {
  const session = parseSession(request);

  if (!session) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  if (session.role !== 'publisher') {
    return NextResponse.json({ error: 'Publisher access required' }, { status: 403 });
  }

  let connection: PoolConnection | null = null;

  try {
    connection = await pool.getConnection();

    const [publisherRows] = await connection.query(
      'SELECT username FROM publisher WHERE username = ? LIMIT 1',
      [session.username]
    );

    if (!Array.isArray(publisherRows) || publisherRows.length === 0) {
      return NextResponse.json({ error: 'Publisher access required' }, { status: 403 });
    }

    const url = new URL(request.url);
    const filterGame = url.searchParams.get('gameId');
    const filterTopic = url.searchParams.get('topic');
    const limit = Math.min(Number(url.searchParams.get('limit') ?? 50), 200);
    const offset = Math.max(Number(url.searchParams.get('offset') ?? 0), 0);

    const conditions: string[] = ['g.publisher_username = ?'];
    const values: any[] = [session.username];

    if (filterGame) {
      const parsedGame = Number(filterGame);
      if (Number.isFinite(parsedGame)) {
        conditions.push('r.game_id = ?');
        values.push(parsedGame);
      }
    }

    if (filterTopic) {
      conditions.push('r.report_topic = ?');
      values.push(filterTopic);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const [rows] = await connection.query(
      `SELECT r.game_id, r.username, r.report_topic, r.detail, r.report_time,
              g.game_name
       FROM report r
       INNER JOIN game g ON g.game_id = r.game_id
       ${whereClause}
       ORDER BY r.report_time DESC
       LIMIT ? OFFSET ?`,
      [...values, limit, offset]
    );

    const reports: ReportRecord[] = Array.isArray(rows)
      ? rows.map((row, index) => normalizeReportRow(row, offset + index + 1))
      : [];

    const [countRows] = await connection.query(
      `SELECT COUNT(*) as total
       FROM report r
       INNER JOIN game g ON g.game_id = r.game_id
       ${whereClause}`,
      values
    );

    let total = 0;
    if (Array.isArray(countRows) && countRows.length > 0) {
      const firstRow = countRows[0] as Record<string, any>;
      total = Number(firstRow?.total ?? 0);
    }

    return NextResponse.json(
      {
        reports,
        total,
        limit,
        offset,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Publisher reports fetch error:', error);
    return NextResponse.json({ error: 'Failed to load reports' }, { status: 500 });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
