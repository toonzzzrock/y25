import { NextRequest, NextResponse } from 'next/server';
import { resolveUserAssets } from '@/lib/user-assets';

export async function GET(request: NextRequest, context: { params: Promise<{ username: string }> }) {
  let rawUsername: string | undefined;

  try {
    rawUsername = (await context.params)?.username;
  } catch (error) {
    console.error('Failed to resolve route params', error);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  if (!rawUsername) {
    return NextResponse.json({ error: 'Username required' }, { status: 400 });
  }

  const decodedUsername = (() => {
    try {
      return decodeURIComponent(rawUsername);
    } catch {
      return rawUsername;
    }
  })();

  const assets = await resolveUserAssets(decodedUsername);

  return NextResponse.json(
    {
      username: decodedUsername,
      avatarUrl: assets.avatarUrl,
      description: assets.description,
    },
    { status: 200 }
  );
}
