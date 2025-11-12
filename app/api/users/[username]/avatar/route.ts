/**
 * Dynamic User Avatar API
 * GET /api/users/[username]/avatar
 * Serves user avatar images in any format (jpg, png, svg, etc.)
 */

import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const SUPPORTED_EXTENSIONS = ['svg', 'png', 'jpg', 'jpeg', 'gif', 'webp'];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    
    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    const userDir = path.join(process.cwd(), 'public', 'data', 'user', username);
    
    // Try to find the avatar image with any supported extension
    let avatarPath: string | null = null;
    let extension: string | null = null;

    for (const ext of SUPPORTED_EXTENSIONS) {
      // First try user_profile.* (current format)
      let testPath = path.join(userDir, `user_profile.${ext}`);
      if (existsSync(testPath)) {
        avatarPath = testPath;
        extension = ext;
        break;
      }
      // Fallback to avatar.* for backward compatibility
      testPath = path.join(userDir, `avatar.${ext}`);
      if (existsSync(testPath)) {
        avatarPath = testPath;
        extension = ext;
        break;
      }
    }

    if (!avatarPath || !extension) {
      // Return default placeholder
      const placeholderPath = path.join(process.cwd(), 'public', 'images', 'placeholder.svg');
      if (existsSync(placeholderPath)) {
        const placeholderBuffer = await readFile(placeholderPath);
        return new NextResponse(placeholderBuffer, {
          status: 200,
          headers: {
            'Content-Type': 'image/svg+xml',
            'Cache-Control': 'public, max-age=3600',
          },
        });
      } else {
        return NextResponse.json(
          { error: 'Avatar image not found' },
          { status: 404 }
        );
      }
    }

    // Read and serve the found image
    const imageBuffer = await readFile(avatarPath);
    
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
    console.error('User avatar image error:', error);
    return NextResponse.json(
      { error: 'Failed to load avatar image' },
      { status: 500 }
    );
  }
}