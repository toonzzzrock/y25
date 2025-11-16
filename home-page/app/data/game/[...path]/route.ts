/**
 * Dynamic Game Files API
 * Serves game files from the public/data/game directory
 * Supports: GET, HEAD /data/game/[gameId]/game_version/[version]/[...files]
 */

import { NextRequest, NextResponse } from 'next/server';
import { readFile, stat } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { PUBLIC_ROOT } from '@/lib/public-root';

const CONTENT_TYPE_MAP: { [key: string]: string } = {
  html: 'text/html; charset=utf-8',
  htm: 'text/html; charset=utf-8',
  css: 'text/css; charset=utf-8',
  js: 'application/javascript; charset=utf-8',
  mjs: 'application/javascript; charset=utf-8',
  json: 'application/json; charset=utf-8',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  webp: 'image/webp',
  ico: 'image/x-icon',
  woff: 'font/woff',
  woff2: 'font/woff2',
  ttf: 'font/ttf',
  otf: 'font/otf',
  eot: 'application/vnd.ms-fontobject',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  mp4: 'video/mp4',
  webm: 'video/webm',
  pdf: 'application/pdf',
  zip: 'application/zip',
  txt: 'text/plain; charset=utf-8',
};

function getContentType(filePath: string): string {
  const ext = path.extname(filePath).slice(1).toLowerCase();
  return CONTENT_TYPE_MAP[ext] || 'application/octet-stream';
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await params;

    if (!pathSegments || pathSegments.length === 0) {
      return NextResponse.json(
        { error: 'Invalid path' },
        { status: 400 }
      );
    }

    // Construct the file path using PUBLIC_ROOT
    const requestedPath = pathSegments.join('/');
    const filePath = path.join(PUBLIC_ROOT, 'data', 'game', requestedPath);

    // Security: Ensure the resolved path is within PUBLIC_ROOT
    const normalizedFilePath = path.normalize(filePath);
    const normalizedPublicRoot = path.normalize(PUBLIC_ROOT);
    
    if (!normalizedFilePath.startsWith(normalizedPublicRoot)) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Check if file exists
    if (!existsSync(filePath)) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Get file stats
    const fileStats = await stat(filePath);
    
    if (!fileStats.isFile()) {
      return NextResponse.json(
        { error: 'Not a file' },
        { status: 400 }
      );
    }

    // Read the file
    const fileBuffer = await readFile(filePath);
    const contentType = getContentType(filePath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': fileStats.size.toString(),
        'Cache-Control': 'public, max-age=3600',
        'Last-Modified': fileStats.mtime.toUTCString(),
      },
    });
  } catch (error) {
    console.error('Error serving game file:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function HEAD(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await params;

    if (!pathSegments || pathSegments.length === 0) {
      return new NextResponse(null, { status: 400 });
    }

    // Construct the file path using PUBLIC_ROOT
    const requestedPath = pathSegments.join('/');
    const filePath = path.join(PUBLIC_ROOT, 'data', 'game', requestedPath);

    // Security: Ensure the resolved path is within PUBLIC_ROOT
    const normalizedFilePath = path.normalize(filePath);
    const normalizedPublicRoot = path.normalize(PUBLIC_ROOT);
    
    if (!normalizedFilePath.startsWith(normalizedPublicRoot)) {
      return new NextResponse(null, { status: 403 });
    }

    // Check if file exists
    if (!existsSync(filePath)) {
      return new NextResponse(null, { status: 404 });
    }

    // Get file stats
    const fileStats = await stat(filePath);
    
    if (!fileStats.isFile()) {
      return new NextResponse(null, { status: 400 });
    }

    const contentType = getContentType(filePath);

    return new NextResponse(null, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': fileStats.size.toString(),
        'Cache-Control': 'public, max-age=3600',
        'Last-Modified': fileStats.mtime.toUTCString(),
      },
    });
  } catch (error) {
    console.error('Error checking game file:', error);
    return new NextResponse(null, { status: 500 });
  }
}
