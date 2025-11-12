import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

type SessionUser = {
  username: string;
};

const ALLOWED_TOPICS = new Set<string>(['Lag', 'Disconnect', 'Bug']);

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

    return { username: decoded.username };
  } catch (error) {
    console.error('Report session parse error:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  const session = getSessionUser(request);

  if (!session) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  let payload: any;
  try {
    payload = await request.json();
  } catch (error) {
    console.error('Report payload parse error:', error);
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const parsedId = Number(payload?.gameId ?? payload?.game_id);
  const topic = typeof payload?.topic === 'string' ? payload.topic.trim() : '';
  const detail = typeof payload?.detail === 'string' ? payload.detail.trim() : '';

  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    return NextResponse.json({ error: 'Invalid game id' }, { status: 400 });
  }

  if (!ALLOWED_TOPICS.has(topic)) {
    return NextResponse.json({ error: 'Invalid report topic' }, { status: 400 });
  }

  if (detail.length < 5) {
    return NextResponse.json({ error: 'Report detail must be at least 5 characters' }, { status: 400 });
  }

  if (detail.length > 2000) {
    return NextResponse.json({ error: 'Report detail is too long' }, { status: 400 });
  }

  const connection = await pool.getConnection();

  try {
    const [gameRows] = await connection.query('SELECT game_id FROM game WHERE game_id = ? LIMIT 1', [parsedId]);
    if (!Array.isArray(gameRows) || gameRows.length === 0) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    await connection.query(
      `INSERT INTO report (username, game_id, report_topic, detail, report_time)
       VALUES (?, ?, ?, ?, NOW())`,
      [session.username, parsedId, topic, detail]
    );

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error: any) {
    console.error('Report insert error:', error);
    return NextResponse.json({ error: 'Failed to submit report' }, { status: 500 });
  } finally {
    connection.release();
  }
}