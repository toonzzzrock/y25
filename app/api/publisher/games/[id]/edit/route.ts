import { NextRequest, NextResponse } from 'next/server';
import { callProcedure } from '@/lib/db';

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
    console.error('Edit game session parse error:', error);
    return null;
  }
}

function sanitizeFolder(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, '');
}

function sanitizeFile(value: string): string {
  const trimmed = value.trim().replace(/\\/g, '/');
  const segments = trimmed.split('/').filter(Boolean);
  return segments.join('/');
}

export async function PATCH(
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

  let payload: {
    gameName?: string;
    updateTitle?: string;
    updateDescription?: string;
    versionFolder?: string;
    linkFileName?: string;
  };

  try {
    payload = await request.json();
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const gameName = (payload.gameName ?? '').trim();
  const updateTitle = (payload.updateTitle ?? '').trim();
  const updateDescription = (payload.updateDescription ?? '').trim();
  const versionFolder = sanitizeFolder(payload.versionFolder ?? '');
  const linkFileName = sanitizeFile(payload.linkFileName ?? '');

  if (!gameName) {
    return NextResponse.json({ error: 'Game name is required' }, { status: 400 });
  }

  if (!versionFolder) {
    return NextResponse.json({ error: 'Version folder is required' }, { status: 400 });
  }

  if (!linkFileName) {
    return NextResponse.json({ error: 'Main file name is required' }, { status: 400 });
  }

  if (!updateTitle && !updateDescription) {
    return NextResponse.json({ error: 'Update details are required' }, { status: 400 });
  }

  try {
    const ownershipRows = await callProcedure<GameOwnershipRow[]>('sp_get_game_owner', [gameId]);
    if (!Array.isArray(ownershipRows) || ownershipRows.length === 0) {
      return NextResponse.json({ error: 'Game not found or access denied' }, { status: 404 });
    }

    const owner = ownershipRows[0];
    if (owner.publisher_username !== session.username) {
      return NextResponse.json({ error: 'Game not found or access denied' }, { status: 404 });
    }

    const linkToFile = `/data/game/${gameId}/game_version/${versionFolder}/${linkFileName}`;
    const patchNumber = versionFolder;
    const finalTitle = updateTitle || versionFolder;
    const finalDetail = updateDescription || 'Update details pending';

    await callProcedure('sp_publisher_submit_game_update', [
      gameId,
      gameName,
      patchNumber,
      finalTitle,
      finalDetail,
      linkToFile,
    ]);

    return NextResponse.json(
      {
        message: 'Game updated successfully',
        game: {
          id: gameId,
          title: gameName,
        },
        update: {
          patchNumber,
          title: finalTitle,
          detail: finalDetail,
          linkToFile,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Edit game error:', error);
    return NextResponse.json(
      { error: 'Failed to update game' },
      { status: 500 }
    );
  }
}
