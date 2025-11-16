import path from 'path';
import { promises as fs } from 'fs';
import { PUBLIC_ROOT } from '@/lib/public-root';

const USER_ASSET_ROOT = path.join(PUBLIC_ROOT, 'data', 'user');

export function getUserAssetDirectory(username: string) {
  return path.join(USER_ASSET_ROOT, username);
}

export async function ensureUserAssetDirectory(username: string) {
  const dir = getUserAssetDirectory(username);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

async function findAvatarFilename(dir: string) {
  try {
    const entries = await fs.readdir(dir);
    // First look for user_profile.* (current format)
    let avatarFile = entries.find((file) => file.startsWith('user_profile.'));
    if (avatarFile) return avatarFile;
    // Fallback to avatar.* for backward compatibility
    return entries.find((file) => file.startsWith('avatar.')) || null;
  } catch (error: any) {
    if (error?.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

export async function resolveUserAssets(username: string) {
  const dir = getUserAssetDirectory(username);
  let avatarUrl: string | null = null;
  let description = '';

  try {
    const avatarFile = await findAvatarFilename(dir);

    if (avatarFile) {
      // Use the new dynamic avatar API
      avatarUrl = `/api/users/${username}/avatar`;
    }

    try {
      const rawDescription = await fs.readFile(path.join(dir, 'description.txt'), 'utf-8');
      description = rawDescription.replace(/\r\n/g, '\n');
    } catch (error: any) {
      if (error?.code !== 'ENOENT') {
        throw error;
      }
      description = '';
    }
  } catch (error: any) {
    if (error?.code !== 'ENOENT') {
      console.error('Failed to resolve user assets:', error);
    }
    avatarUrl = null;
    description = '';
  }

  if (!avatarUrl) {
    avatarUrl = generateFallbackAvatar(username);
  }

  return { avatarUrl, description };
}

function generateFallbackAvatar(username: string) {
  const cleanName = typeof username === 'string' && username.trim().length > 0 ? username.trim() : 'User';
  const initials = cleanName
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || 'U';

  const palette = ['#FF7A2B', '#3A78F2', '#2E8B57', '#8257E5', '#E53E3E'];
  const color = palette[stringHash(cleanName) % palette.length];

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect width="80" height="80" rx="12" fill="${color}"/><text x="50%" y="54%" font-size="32" font-family="Arial, sans-serif" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">${initials}</text></svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function stringHash(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    const char = value.charCodeAt(index);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

export async function saveUserDescription(username: string, description: string) {
  const dir = await ensureUserAssetDirectory(username);
  await fs.writeFile(path.join(dir, 'description.txt'), description, 'utf-8');
}

export async function replaceUserAvatar(username: string, buffer: Buffer, extension: string) {
  const dir = await ensureUserAssetDirectory(username);
  const avatarFile = `user_profile.${extension}`;

  try {
    const entries = await fs.readdir(dir);
    await Promise.all(
      entries
        .filter((file) => file.startsWith('user_profile.') && file !== avatarFile)
        .map((file) => fs.unlink(path.join(dir, file)).catch(() => undefined))
    );
  } catch (error: any) {
    if (error?.code !== 'ENOENT') {
      throw error;
    }
  }

  await fs.writeFile(path.join(dir, avatarFile), buffer);
  return avatarFile;
}
