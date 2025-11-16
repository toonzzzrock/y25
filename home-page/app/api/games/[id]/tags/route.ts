import { NextRequest, NextResponse } from 'next/server';
import type { RowDataPacket } from 'mysql2/promise';
import { callProcedure } from '@/lib/db';

interface GameTag extends RowDataPacket {
  tag_name: string;
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

    // Fetch tags for the specific game
    const tags = await callProcedure<GameTag>('sp_get_game_tags', [gameId]);
  const tagNames = tags.map((tag: any) => tag.tag_name);

    return NextResponse.json({ tags: tagNames });
  } catch (error) {
    console.error('Game tags fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch game tags' },
      { status: 500 }
    );
  }
}