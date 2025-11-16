/**
 * Game Upload API Route
 * POST /api/games/upload
 * Handles game uploads with files and database insertion
 */

import { NextRequest, NextResponse } from 'next/server';
import { callProcedure } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { PUBLIC_ROOT } from '@/lib/public-root';

// Configure route to handle larger file uploads
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type SessionUser = {
  username: string;
  email?: string | null;
  role?: string | null;
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
    console.error('Upload session parse error:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  const session = getSessionUser(request);

  if (!session) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  try {
    const formData = await request.formData();
    
    const gameName = formData.get('gameName') as string;
    const description = formData.get('description') as string;
    const linkToFilePath = formData.get('linkToFilePath') as string;
    const gameProfile = formData.get('gameProfile') as File;
    const gameFiles = formData.getAll('gameFiles') as File[];

    // Validation
    if (!gameName) {
      return NextResponse.json(
        { error: 'Game name is required' },
        { status: 400 }
      );
    }

    if (!description || !description.toString().trim()) {
      return NextResponse.json(
        { error: 'Game description is required' },
        { status: 400 }
      );
    }

    if (!linkToFilePath || !linkToFilePath.toString().trim()) {
      return NextResponse.json(
        { error: 'Main file path is required' },
        { status: 400 }
      );
    }

    if (!gameProfile) {
      return NextResponse.json(
        { error: 'Game profile image is required' },
        { status: 400 }
      );
    }

    if (!gameFiles || gameFiles.length === 0) {
      return NextResponse.json(
        { error: 'At least one game file is required' },
        { status: 400 }
      );
    }

    // Check if user is a publisher (via proc)
    const pubExists: any[] = await callProcedure<any[]>('sp_publisher_exists', [session.username]);
    const existsFlag = Array.isArray(pubExists) && pubExists[0] && (pubExists[0].exists_flag === 1 || pubExists[0].exists_flag === true);
    if (!existsFlag) {
      return NextResponse.json(
        { error: 'Only publishers can upload games' },
        { status: 403 }
      );
    }

    // Create game via procedure
    const now = new Date();
    const releaseDate = now.toISOString().slice(0,19).replace('T',' '); // initial release timestamp or could defer
    const status = 'Pending';
    // Temporary link placeholder; will be updated after files are written
    const tempLink = '/data/game/pending';
    const createRows: any[] = await callProcedure<any[]>('sp_create_game', [
      session.username,
      gameName,
      description || null,
      tempLink,
      releaseDate,
      status
    ]);
    // sp_create_game returns a single row with game_id
    const gameId = Array.isArray(createRows) && createRows[0] && createRows[0].game_id
      ? createRows[0].game_id
      : null;
    if (!gameId) {
      return NextResponse.json({ error: 'Failed to obtain new game id' }, { status: 500 });
    }

    // Create game directory structure
  const gameDir = path.join(PUBLIC_ROOT, 'data', 'game', String(gameId));
    const gameVersionDir = path.join(gameDir, 'game_version', '0');

    // Create directories if they don't exist
    await mkdir(gameDir, { recursive: true });
    await mkdir(gameVersionDir, { recursive: true });

    // Save game profile image
    const profileExtension = gameProfile.name.split('.').pop() || 'svg';
    const profilePath = path.join(gameDir, `game_profile.${profileExtension}`);
    const profileBuffer = Buffer.from(await gameProfile.arrayBuffer());
    await writeFile(profilePath, profileBuffer);

    // Save game files to game_version/0 directory
    for (const file of gameFiles) {
      const fileName = file.name;
      
      // Handle nested paths from folder uploads
      // Extract relative path if it exists (from webkitRelativePath)
      const relativePath = (file as any).webkitRelativePath || fileName;
      const pathParts = relativePath.split('/');
      
      // Remove the first part (folder name) and construct the file path
      const fileRelativePath = pathParts.length > 1 ? pathParts.slice(1).join('/') : fileName;
      const filePath = path.join(gameVersionDir, fileRelativePath);
      
      // Create nested directories if needed
      const fileDir = path.dirname(filePath);
      if (!existsSync(fileDir)) {
        await mkdir(fileDir, { recursive: true });
      }
      
      const fileBuffer = Buffer.from(await file.arrayBuffer());
      await writeFile(filePath, fileBuffer);
    }

    const sanitizedPath = String(linkToFilePath).trim();
    const finalLink = '/data/game/' + gameId + '/game_version/0/' + (sanitizedPath || 'index.html');

    // Update game link_to_file now that files exist
    await callProcedure('sp_update_game_link', [gameId, finalLink]);

    // Insert initial game update history record via procedure
    await callProcedure('sp_game_add_initial_update', [gameId, finalLink]);

    return NextResponse.json(
      {
        success: true,
        message: 'Game uploaded successfully and pending approval',
        gameId,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Game upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload game: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
}
