import { NextRequest, NextResponse } from 'next/server';
import { readdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function normalizeGameId(rawId: string): number | null {
  const parsed = Number(rawId);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const gameId = normalizeGameId(id);

  if (!gameId) {
    return NextResponse.json({ error: 'Invalid game id', folders: [] }, { status: 400 });
  }

  const versionRoot = path.join(
    process.cwd(),
    'public',
    'data',
    'game',
    String(gameId),
    'game_version'
  );

  try {
    if (!existsSync(versionRoot)) {
      return NextResponse.json({ folders: [] }, { status: 200 });
    }

    const dirents = await readdir(versionRoot, { withFileTypes: true });
    const folders = dirents
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .filter((name) => name.trim().length > 0);

    return NextResponse.json({ folders }, { status: 200 });
  } catch (error: any) {
    console.error('Version folder listing error:', error);
    return NextResponse.json({ folders: [] }, { status: 200 });
  }
}
