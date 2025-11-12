/**
 * Login API Route
 * POST /api/auth/login
 * Validates user credentials and returns session token
 */

import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { verifyPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username or email and password required' },
        { status: 400 }
      );
    }

    const connection = await pool.getConnection();
    try {
      // Get user from database - check by username OR email
      const [users] = await connection.query(
        `SELECT username, password_encrypted, salt_random_value, email FROM User WHERE username = ? OR email = ?`,
        [username, username]
      );

      if ((users as any[]).length === 0) {
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
        return NextResponse.json(
          { error: 'Invalid username, email or password' },
          { status: 401 }
        );
      }

      const [publisherRows] = await connection.query(
        'SELECT account_name FROM publisher WHERE username = ? LIMIT 1',
        [user.username]
      );

      const isPublisher = Array.isArray(publisherRows) && publisherRows.length > 0;
      const role: 'publisher' | 'user' = isPublisher ? 'publisher' : 'user';

      // Create session token (simple approach - in production use JWT or secure session)
      const sessionToken = Buffer.from(
        JSON.stringify({
          username: user.username,
          email: user.email,
          role,
          timestamp: Date.now()
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
    console.error('Login error:', error.message || error);
    console.error('Stack:', error.stack);
    
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
