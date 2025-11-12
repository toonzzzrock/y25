/**
 * Check if a game file exists by making a HEAD request
 */
export async function checkGameFileExists(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { 
      method: 'HEAD',
      cache: 'no-cache'
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Extract game ID from a game URL path
 */
export function extractGameIdFromUrl(url: string): string | null {
  const match = url.match(/\/data\/game\/(\d+)/);
  return match ? match[1] : null;
}