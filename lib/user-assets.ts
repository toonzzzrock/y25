import path from 'path';
import { promises as fs } from 'fs';

const USER_ASSET_ROOT = path.join(process.cwd(), 'public', 'data', 'user');

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
    return entries.find((file) => file.startsWith('user_profile.')) || null;
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
      try {
        const stats = await fs.stat(path.join(dir, avatarFile));
        const version = Math.floor(stats.mtimeMs).toString(36);
        avatarUrl = `/data/user/${username}/${avatarFile}?v=${version}`;
      } catch {
        avatarUrl = `/data/user/${username}/${avatarFile}`;
      }
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

  return { avatarUrl, description };
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
