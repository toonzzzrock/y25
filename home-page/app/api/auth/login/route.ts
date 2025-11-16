/**
 * Login API Route
 * POST /api/auth/login
 * Validates user credentials and returns session token
 */

import { NextRequest, NextResponse } from 'next/server';
import { pool, callProcedure } from '@/lib/db';
import { verifyPassword } from '@/lib/auth';
import { randomBytes, createHash } from 'crypto';

function buildDeviceFingerprint(request: NextRequest): string {
  const userAgent = request.headers.get('user-agent') ?? 'unknown-agent';
  const brands = request.headers.get('sec-ch-ua') ?? '';
  const platform = request.headers.get('sec-ch-ua-platform') ?? '';
  const mobile = request.headers.get('sec-ch-ua-mobile') ?? '';
  const language = request.headers.get('accept-language') ?? '';
  const ipChain = request.headers.get('x-forwarded-for') ?? '';

  const rawFingerprint = [userAgent, brands, platform, mobile, language, ipChain]
    .map((value) => value.trim())
    .filter(Boolean)
    .join('|');

  if (!rawFingerprint) {
    return 'unknown-device';
  }

  const hash = createHash('sha256').update(rawFingerprint).digest('hex');
  const descriptor = platform || (userAgent.split('(')[1]?.split(')')[0] ?? userAgent.split(';')[0] ?? 'unknown');
  const summarized = `${descriptor}#${hash.slice(0, 16)}`;
  return summarized.slice(0, 255);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    const obfuscateIdentifier = (value: string | undefined | null): string => {
      if (!value) {
        return 'unknown';
      }
      const trimmed = value.trim();
      if (trimmed.length <= 3) {
        return `${trimmed}-len${trimmed.length}`;
      }
      return `${trimmed.slice(0, 3)}***-len${trimmed.length}`;
    };

    const attemptLabel = obfuscateIdentifier(username);
    console.info('[api/auth/login] Incoming login attempt.', {
      identifier: attemptLabel,
      userAgent: request.headers.get('user-agent') ?? 'unknown',
    });

    if (!username || !password) {
      console.warn('[api/auth/login] Missing credentials.', {
        identifier: attemptLabel,
      });
      return NextResponse.json(
        { error: 'Username or email and password required' },
        { status: 400 }
      );
    }

    const connection = await pool.getConnection();
    try {
      // Get user from database via stored procedure - check by username OR email
      const users: any[] = await callProcedure<any[]>('sp_validate_login_fetch', [username]);

      if ((users as any[]).length === 0) {
        console.warn('[api/auth/login] Identifier not found.', {
          identifier: attemptLabel,
        });
        return NextResponse.json(
          { error: 'Invalid username, email or password' },
          { status: 401 }
        );
      }

      const user = (users as any[])[0];
      
      console.log('User found:', user.username);
      console.log('User salt_random_value type:', typeof user.salt_random_value);
      console.log('User salt_random_value:', user.salt_random_value);
      
      // Convert salt to Buffer if it's not already
      let salt = user.salt_random_value;
      if (typeof salt === 'string') {
        // If it's a hex string, convert from hex to Buffer
        salt = Buffer.from(salt, 'hex');
        console.log('Converted from hex string');
      } else if (salt instanceof Buffer) {
        // If it's a Buffer, it might be ASCII bytes of a hex string (from MySQL VARBINARY)
        // Try to interpret it as UTF-8 string first
        const saltStr = salt.toString('utf-8');
        console.log('Buffer as UTF-8 string:', saltStr);
        
        // Check if it looks like a hex string (64 hex characters)
        if (/^[0-9a-f]{64}$/i.test(saltStr)) {
          console.log('Detected as hex string stored in buffer, converting from hex');
          salt = Buffer.from(saltStr, 'hex');
        } else {
          console.log('Treating as raw binary buffer');
        }
      } else {
        // If it's something else, ensure it's a Buffer
        salt = Buffer.from(salt);
        console.log('Converted from other type');
      }

      console.log('Final salt (hex):', salt.toString('hex'));

      // Verify password
      const isValid = verifyPassword(password, salt, user.password_encrypted);

      if (!isValid) {
        console.warn('[api/auth/login] Password verification failed.', {
          identifier: attemptLabel,
        });
        return NextResponse.json(
          { error: 'Invalid username, email or password' },
          { status: 401 }
        );
      }

      const pubRows: any[] = await callProcedure<any[]>('sp_publisher_exists', [user.username]);
      const isPublisher = Array.isArray(pubRows) && pubRows[0] && (pubRows[0].exists_flag === 1 || pubRows[0].exists_flag === true);
      const role: 'publisher' | 'user' = isPublisher ? 'publisher' : 'user';
      const deviceFingerprint = buildDeviceFingerprint(request);

      try {
        await callProcedure('sp_insert_session', [user.username, deviceFingerprint]);
      } catch (error) {
        console.error('Failed to upsert session record:', error);
        throw new Error('Unable to record session information');
      }

      // Create session token (simple approach - in production use JWT or secure session)
      const sessionToken = Buffer.from(
        JSON.stringify({
          username: user.username,
          email: user.email,
          role,
          timestamp: Date.now(),
          device: deviceFingerprint,
        })
      ).toString('base64');

      // Create response with session cookie
      const response = NextResponse.json(
        {
          success: true,
          message: 'Login successful',
          user: { username: user.username, email: user.email, role }
        },
        { status: 200 }
      );

      // Set session cookie (httpOnly for security)
      response.cookies.set('auth_session', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 // 7 days
      });

      return response;
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error('[api/auth/login] Unexpected error.', {
      error: error?.message || error,
      stack: error?.stack,
    });
    
    // Check if it's a database connection error
    if (error.code === 'ECONNREFUSED' || error.errno === -111) {
      return NextResponse.json(
        { error: 'Database connection failed. Please contact administrator.' },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to login: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
}
