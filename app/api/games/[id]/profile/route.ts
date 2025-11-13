/**
 * Dynamic Game Profile Image API
 * GET /api/games/[id]/profile
 * Serves game profile images in any format (jpg, png, svg, etc.)
 */

import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { generateFallbackAvatar } from '@/lib/fallback-avatar';

const SUPPORTED_EXTENSIONS = ['svg', 'png', 'jpg', 'jpeg', 'gif', 'webp'];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: gameId } = await params;
    
    if (!gameId) {
      return NextResponse.json(
        { error: 'Game ID is required' },
        { status: 400 }
      );
    }

    const gameDir = path.join(process.cwd(), 'public', 'data', 'game', gameId);
    
    // Try to find the profile image with any supported extension
    let profilePath: string | null = null;
    let extension: string | null = null;

    for (const ext of SUPPORTED_EXTENSIONS) {
      const testPath = path.join(gameDir, `game_profile.${ext}`);
      if (existsSync(testPath)) {
        profilePath = testPath;
        extension = ext;
        break;
      }
    }

    if (!profilePath || !extension) {
      // Return fallback SVG avatar with game name
      const gameName = `Game ${gameId}`;
      const fallbackSvg = generateFallbackAvatar(gameName);
      
      // Remove the data URI prefix and decode
      const base64Data = fallbackSvg.replace('data:image/svg+xml;utf8,', '');
      const svgContent = decodeURIComponent(base64Data);

      return new NextResponse(svgContent, {
        status: 200,
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }

    // Read and serve the found image
    const imageBuffer = await readFile(profilePath);
    
    // Set appropriate content type
    const contentTypeMap: { [key: string]: string } = {
      svg: 'image/svg+xml',
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      gif: 'image/gif',
      webp: 'image/webp',
    };

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentTypeMap[extension] || 'application/octet-stream',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Game profile image error:', error);
    return NextResponse.json(
      { error: 'Failed to load profile image' },
      { status: 500 }
    );
  }
}
