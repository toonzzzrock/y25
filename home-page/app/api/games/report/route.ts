import { NextRequest, NextResponse } from 'next/server';
import { callProcedure } from '@/lib/db';
import { reportTopicSet } from '@/lib/data/reportTopics';

type SessionUser = {
  username: string;
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

  const body = await request.json().catch(() => null);

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const data = body as Record<string, unknown>;
  const gameId = Number(data.gameId ?? data.game_id);
  const topic = typeof data.topic === 'string' ? data.topic.trim() : '';
  const detail = typeof data.detail === 'string' ? data.detail.trim() : '';
  const detailLength = detail.length;

  if (!Number.isInteger(gameId) || gameId <= 0) {
    return NextResponse.json({ error: 'Invalid game id' }, { status: 400 });
  }

  if (!topic || !reportTopicSet.has(topic)) {
    return NextResponse.json({ error: 'Invalid report topic' }, { status: 400 });
  }

  if (detailLength < 5) {
    return NextResponse.json({ error: 'Report detail must be at least 5 characters' }, { status: 400 });
  }

  if (detailLength > 2000) {
    return NextResponse.json({ error: 'Report detail is too long' }, { status: 400 });
  }

  try {
    const validationRows = await callProcedure<any[]>('sp_check_game_exists', [gameId]);
    if (!Array.isArray(validationRows) || validationRows.length === 0) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    await callProcedure('sp_create_game_report', [gameId, session.username, topic, detail]);

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Report insert error:', error);
    return NextResponse.json({ error: 'Failed to submit report' }, { status: 500 });
  }
}