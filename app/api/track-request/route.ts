/**
 * Generic API Request Tracker
 * This endpoint tracks requests from external applications (e.g., port 3000)
 * Can be called manually to increment the API request counter
 */

import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET(request: Request) {
  return trackRequest(request);
}

export async function POST(request: Request) {
  return trackRequest(request);
}

async function trackRequest(request: Request) {
  try {
    const trackingFile = path.join(process.cwd(), 'public', 'api-requests-tracking.json');
    const now = new Date();
    const currentHour = now.getHours();
    const origin = request.headers.get('origin') || request.headers.get('referer') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    let requestData = {
      history: Array(24).fill(0),
      currentHour: currentHour,
      lastUpdated: now.toISOString(),
      port: '8000',
    };

    // Try to read existing tracking data
    try {
      const fileContent = await fs.readFile(trackingFile, 'utf-8');
      const parsed = JSON.parse(fileContent);
      if (Array.isArray(parsed.history)) {
        requestData.history = parsed.history;
      }
    } catch {
      // File doesn't exist yet
    }

    // Increment current hour
    const previousCount = requestData.history[currentHour] || 0;
    requestData.history[currentHour] = previousCount + 1;
    requestData.lastUpdated = now.toISOString();

    // Save updated tracking data
    await fs.writeFile(
      trackingFile,
      JSON.stringify(requestData, null, 2),
      'utf-8'
    );

    console.log(`[Track Request] External API request tracked from ${origin} - Hour ${currentHour}: ${requestData.history[currentHour]} total requests`);

    return NextResponse.json({
      success: true,
      message: 'Request tracked successfully',
      currentHour,
      requestCount: requestData.history[currentHour],
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error('[Track Request] Failed to track request:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to track request',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
