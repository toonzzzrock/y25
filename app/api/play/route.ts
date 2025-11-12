import { NextRequest, NextResponse } from 'next/server';
import type { PoolConnection } from 'mysql2/promise';
import { pool } from '@/lib/db';

interface SessionUser {
  username: string;
}

interface ParsedBody {
  gameId: number;
  durationMs: number;
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
    };
  } catch (error) {
    console.error('Play tracking session parse error:', error);
    return null;
  }
}

function normalizePayload(data: unknown): ParsedBody | null {
  if (!data || typeof data !== 'object') {
    return null;
  }

  const payload = data as Record<string, unknown>;
  const rawGame = payload.gameId;
  const rawDuration = payload.durationMs;

  const gameId = Number(rawGame);
  const durationMs = Number(rawDuration);

  if (!Number.isFinite(gameId) || gameId <= 0) {
    return null;
  }

  if (!Number.isFinite(durationMs) || durationMs <= 0) {
    return null;
  }

  return {
    gameId,
    durationMs,
  };
}

export async function POST(request: NextRequest) {
  const session = parseSession(request);

  if (!session) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  let payload: ParsedBody | null = null;

  try {
    const body = await request.json();
    payload = normalizePayload(body);
  } catch (error) {
    console.warn('Play tracking payload parse error:', error);
  }

  if (!payload) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const seconds = Math.max(1, Math.round(payload.durationMs / 1000));

  let connection: PoolConnection | null = null;

  try {
    connection = await pool.getConnection();

    await connection.execute(
      `INSERT INTO play (username, game_id, accumulate_play_time)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE accumulate_play_time = accumulate_play_time + VALUES(accumulate_play_time)` as string,
      [session.username, payload.gameId, seconds]
    );

    return NextResponse.json({ ok: true, trackedSeconds: seconds }, { status: 200 });
  } catch (error) {
    console.error('Play tracking insert error:', error);
    return NextResponse.json({ error: 'Failed to record play time' }, { status: 500 });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
