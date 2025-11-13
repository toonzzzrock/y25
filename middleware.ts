import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function middleware(request: NextRequest) {
  // Track API requests from any source (localhost:3000, external clients, etc.)
  if (request.nextUrl.pathname.startsWith('/api/')) {
    try {
      const trackingFile = path.join(process.cwd(), 'public', 'api-requests-tracking.json');
      const now = new Date();
      const currentHour = now.getHours();
      const method = request.method;
      const pathname = request.nextUrl.pathname;
      const origin = request.headers.get('origin') || request.headers.get('host') || 'unknown';

      let requestData = {
        history: Array(24).fill(0),
        currentHour: currentHour,
        lastUpdated: now.toISOString(),
        port: process.env.PORT || '3000',
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
      requestData.history[currentHour] = (requestData.history[currentHour] || 0) + 1;
      requestData.lastUpdated = now.toISOString();

      // Save updated tracking data
      await fs.writeFile(
        trackingFile,
        JSON.stringify(requestData, null, 2),
        'utf-8'
      );

      console.log(`[Middleware] API Request: ${method} ${pathname} from ${origin} - Hour ${currentHour}: ${requestData.history[currentHour]} total requests`);
    } catch (error) {
      // Silently fail - don't interrupt request
      console.error('[Middleware] Failed to track API request:', error);
    }
  }

  return NextResponse.next();
}

// Configure which routes to apply middleware to
export const config = {
  matcher: [
    // Match all API routes regardless of origin
    '/api/:path*',
  ],
};
