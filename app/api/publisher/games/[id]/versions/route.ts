import { NextRequest, NextResponse } from 'next/server';
import type { RowDataPacket } from 'mysql2/promise';
import { pool } from '@/lib/db';
import { existsSync } from 'fs';
import { mkdir, readdir, writeFile } from 'fs/promises';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type SessionUser = {
  username: string;
  role?: string | null;
};

type GameOwnershipRow = RowDataPacket & {
  game_id: number;
};

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
    console.error('Version upload session parse error:', error);
    return null;
  }
}

function sanitizeSegment(segment: string): string {
  return segment.replace(/[\0<>:"|?*]/g, '_');
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = parseSession(request);

  if (!session || !session.username) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const { id } = await context.params;
  const gameId = Number(id);
  if (!Number.isFinite(gameId) || gameId <= 0) {
    return NextResponse.json({ error: 'Invalid game id' }, { status: 400 });
  }

  const [rows] = await pool.query<GameOwnershipRow[]>(
    'SELECT game_id FROM game WHERE game_id = ? AND publisher_username = ? LIMIT 1',
    [gameId, session.username]
  );

  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: 'Game not found or access denied' }, { status: 404 });
  }

  const formData = await request.formData();
  const files = formData
    .getAll('files')
    .filter((item): item is File => item instanceof File);

  if (files.length === 0) {
    return NextResponse.json({ error: 'No files provided' }, { status: 400 });
  }

  const versionRootDir = path.join(
    process.cwd(),
    'public',
    'data',
    'game',
    String(gameId),
    'game_version'
  );

  try {
    if (!existsSync(versionRootDir)) {
      await mkdir(versionRootDir, { recursive: true });
    }

    const entries = await readdir(versionRootDir, { withFileTypes: true }).catch(() => []);
    const numericFolders = entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => Number(entry.name))
      .filter((value) => Number.isFinite(value) && value >= 0);

    const nextVersionNumber = numericFolders.length > 0 ? Math.max(...numericFolders) + 1 : 0;
    const versionFolderName = String(nextVersionNumber);
    const targetDir = path.join(versionRootDir, versionFolderName);

    if (!existsSync(targetDir)) {
      await mkdir(targetDir, { recursive: true });
    }

    const targetRootResolved = path.resolve(targetDir);

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const providedName = file.name || 'file';
      const normalizedPath = providedName.replace(/\\/g, '/');
      const segments = normalizedPath.split('/').filter(Boolean);
      const trimmedSegments = segments.length > 1 ? segments.slice(1) : segments;
      const safeSegments = trimmedSegments
        .filter((segment) => segment !== '.' && segment !== '..')
        .map((segment) => sanitizeSegment(segment.trim()))
        .filter((segment) => segment.length > 0);

      if (safeSegments.length === 0) {
        safeSegments.push(sanitizeSegment(file.name.trim() || 'file'));
      }

      const finalPath = path.join(targetDir, ...safeSegments);
      const resolvedFinalPath = path.resolve(finalPath);

      if (!resolvedFinalPath.startsWith(targetRootResolved)) {
        throw new Error('Invalid file path detected');
      }

      const finalDir = path.dirname(resolvedFinalPath);
      if (!existsSync(finalDir)) {
        await mkdir(finalDir, { recursive: true });
      }

      await writeFile(resolvedFinalPath, buffer);
    }

    return NextResponse.json(
      {
        message: 'Version files uploaded successfully',
        folder: versionFolderName,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Version upload error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to upload version files' },
      { status: 500 }
    );
  }
}
