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
        { error: 'Username and password required' },
        { status: 400 }
      );
    }

    const connection = await pool.getConnection();
    try {
      // Get user from database
      const [users] = await connection.query(
        `SELECT username, password_encrypted, salt_random_value, email FROM User WHERE username = ?`,
        [username]
      );

      if ((users as any[]).length === 0) {
        return NextResponse.json(
          { error: 'Invalid username or password' },
          { status: 401 }
        );
      }

      const user = (users as any[])[0];
      const salt = user.salt_random_value;

      // Verify password
      const isValid = verifyPassword(password, salt, user.password_encrypted);

      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid username or password' },
          { status: 401 }
        );
      }

      // Create session token (simple approach - in production use JWT or secure session)
      const sessionToken = Buffer.from(
        JSON.stringify({
          username: user.username,
          email: user.email,
          timestamp: Date.now()
        })
      ).toString('base64');

      // Create response with session cookie
      const response = NextResponse.json(
        {
          success: true,
          message: 'Login successful',
          user: { username: user.username, email: user.email }
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
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Failed to login' },
      { status: 500 }
    );
  }
}
