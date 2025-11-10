/**
 * Environment Configuration
 * 
 * This module validates and exports all environment variables used in the application.
 * Environment variables are loaded from .env.local (development) or .env.production (production).
 * 
 * Usage in server-side code:
 *   import { env } from '@/lib/env';
 *   console.log(env.MYSQL_HOST);
 * 
 * Usage in client-side code (only NEXT_PUBLIC_ variables):
 *   import { publicEnv } from '@/lib/env';
 *   console.log(publicEnv.NEXT_PUBLIC_API_URL);
 */

/**
 * Server-side environment variables
 * These are only available on the server and should never be exposed to the client
 */
const serverEnv = {
  MYSQL_HOST: process.env.MYSQL_HOST,
  MYSQL_USER: process.env.MYSQL_USER,
  MYSQL_PASSWORD: process.env.MYSQL_PASSWORD,
  MYSQL_DATABASE: process.env.MYSQL_DATABASE,
  MYSQL_CONNECTION_LIMIT: process.env.MYSQL_CONNECTION_LIMIT,
} as const;

/**
 * Client-side environment variables
 * Only variables prefixed with NEXT_PUBLIC_ can be accessed in the browser
 */
const publicEnv = {
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
} as const;

/**
 * Validate environment variables on application startup
 * Throws an error if any required variable is missing
 */
function validateEnv() {
  const requiredServerEnv: (keyof typeof serverEnv)[] = [
    'MYSQL_HOST',
    'MYSQL_USER',
    'MYSQL_PASSWORD',
    'MYSQL_DATABASE',
  ];

  const missingVars = requiredServerEnv.filter(
    (key) => !serverEnv[key]
  );

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}\n` +
      'Please check your .env.local file and ensure all required variables are set.'
    );
  }
}

// Validate on import in server-side code
if (typeof window === 'undefined') {
  validateEnv();
}

export { serverEnv as env, publicEnv };
export type ServerEnv = typeof serverEnv;
export type PublicEnv = typeof publicEnv;
