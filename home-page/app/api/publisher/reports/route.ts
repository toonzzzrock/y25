import { NextRequest, NextResponse } from 'next/server';
import { callProcedure } from '@/lib/db';

interface SessionUser {
  username: string;
}

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
    console.error('Publisher reports session parse error:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  const session = getSessionUser(request);
  if (!session) {
    return NextResponse.json({ error: 'Authentication required', reports: [], total: 0 }, { status: 401 });
  }

  try {
    const publisherRows = await callProcedure<any[]>('sp_publisher_exists', [session.username]);
    const existsFlag = Array.isArray(publisherRows) && publisherRows.length > 0 ? publisherRows[0]?.exists_flag : 0;
    if (!existsFlag) {
      return NextResponse.json({ error: 'Publisher access required', reports: [], total: 0 }, { status: 403 });
    }

    const url = new URL(request.url);
    const limit = Math.min(Math.max(Number(url.searchParams.get('limit') ?? 50), 1), 200);
    const offset = Math.max(Number(url.searchParams.get('offset') ?? 0), 0);
    const filterGameValue = url.searchParams.get('gameId');
    const filterTopic = url.searchParams.get('topic') || null;

    const filterGame = filterGameValue && Number.isFinite(Number(filterGameValue))
      ? Number(filterGameValue)
      : null;

    const rows = await callProcedure<any[]>('sp_get_publisher_reports', [
      session.username,
      filterGame,
      filterTopic,
      limit,
      offset,
    ]);

    const countRows = await callProcedure<any[]>('sp_count_publisher_reports', [
      session.username,
      filterGame,
      filterTopic,
    ]);

    const total = Number(countRows?.[0]?.total ?? 0);

    return NextResponse.json(
      {
        reports: Array.isArray(rows) ? rows : [],
        total,
        limit,
        offset,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Publisher reports fetch error:', error);
    return NextResponse.json({ error: 'Failed to load reports', reports: [], total: 0 }, { status: 500 });
  }
}
