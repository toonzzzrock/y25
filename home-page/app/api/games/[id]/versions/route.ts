import { NextRequest, NextResponse } from 'next/server';
import type { RowDataPacket } from 'mysql2/promise';
import { callProcedure } from '@/lib/db';

interface GameVersion extends RowDataPacket {
  version: string;
  approved_date: string | null;
  created_date: string;
  description: string | null;
  link_to_file_path: string | null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const gameId = parseInt(id);
    
    if (!Number.isInteger(gameId) || gameId <= 0) {
      return NextResponse.json({ error: 'Invalid game ID' }, { status: 400 });
    }

    // Fetch approved game versions for the specific game
    const versions = await callProcedure<GameVersion>('sp_get_game_versions', [gameId]);

  const formattedVersions = versions.map((version: any) => ({
      version: version.version,
      approvedDate: version.approved_date,
      createdDate: version.created_date,
      description: version.description,
      linkToFilePath: version.link_to_file_path
    }));

    return NextResponse.json({ versions: formattedVersions });
  } catch (error) {
    console.error('Game versions fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch game versions' },
      { status: 500 }
    );
  }
}