import { NextRequest, NextResponse } from 'next/server';
import { resolveUserAssets, saveUserDescription, replaceUserAvatar } from '@/lib/user-assets';

interface SessionUser {
  username: string;
}

const ALLOWED_IMAGE_TYPES = new Map<string, string>([
  ['image/png', 'png'],
  ['image/jpeg', 'jpg'],
  ['image/jpg', 'jpg'],
  ['image/webp', 'webp'],
]);

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB

function getSessionUser(request: NextRequest): SessionUser | null {
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
    };
  } catch (error) {
    console.error('Profile content session parse error:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  const session = getSessionUser(request);

  if (!session) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const formData = await request.formData();

  const descriptionValue = formData.get('description');
  const descriptionUpdate = typeof descriptionValue === 'string' ? descriptionValue.replace(/\r\n/g, '\n') : null;

  const profileImageValue = formData.get('profileImage');
  const profileImage = profileImageValue instanceof File && profileImageValue.size > 0 ? profileImageValue : null;

  if (!profileImage && descriptionValue === null) {
    return NextResponse.json({ error: 'No appearance changes provided' }, { status: 400 });
  }

  try {
    if (descriptionValue !== null) {
      const normalized = (descriptionUpdate ?? '').slice(0, 4000);
      await saveUserDescription(session.username, normalized);
    }

    if (profileImage) {
      if (profileImage.size > MAX_IMAGE_BYTES) {
        return NextResponse.json({ error: 'Profile image is too large (limit 5MB)' }, { status: 413 });
      }

      const contentType = profileImage.type;
      const extension = ALLOWED_IMAGE_TYPES.get(contentType);

      if (!extension) {
        return NextResponse.json({ error: 'Unsupported image format. Use PNG, JPEG, or WEBP.' }, { status: 400 });
      }

      const buffer = Buffer.from(await profileImage.arrayBuffer());
      await replaceUserAvatar(session.username, buffer, extension);
    }

    const assets = await resolveUserAssets(session.username);

    return NextResponse.json(
      {
        avatarUrl: assets.avatarUrl,
        description: assets.description,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Profile content update error:', error);
    return NextResponse.json({ error: 'Failed to update profile appearance' }, { status: 500 });
  }
}
