/**
 * Fallback avatar generation
 * Generates colorful SVG avatars with initials based on username/game name
 */

function stringHash(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    const char = value.charCodeAt(index);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

export function generateFallbackAvatar(name: string): string {
  const cleanName = typeof name === 'string' && name.trim().length > 0 ? name.trim() : 'User';
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
