/**
 * Admin signup endpoint
 * Creates new user, developer, or admin accounts
 */

import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import crypto from 'crypto';

// Pepper value - must match the one used in login and y25-design
const PEPPER = process.env.PEPPER_KEY;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, email, password, dob, sex, role } = body;

    // Validate input
    if (!username || !email || !password || !dob || !sex || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate username (20 chars max)
    if (username.length > 20) {
      return NextResponse.json(
        { error: 'Username must be 20 characters or less' },
        { status: 400 }
      );
    }

    // Validate role
    if (!['developer', 'admin'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    const connection = await pool.getConnection();
    try {
      // Check if user already exists
      const [existingUser] = await connection.query(
        'SELECT username FROM User WHERE username = ? OR email = ?',
        [username, email]
      );

      if (Array.isArray(existingUser) && existingUser.length > 0) {
        return NextResponse.json(
          { error: 'Username or email already exists' },
          { status: 409 }
        );
      }

      // Generate salt and hash password using same method as login
      const saltRandomValue = crypto.randomBytes(32);
      const saltHex = saltRandomValue.toString('hex');
      
      // Use SHA256 hash with salt and pepper (same as login verification)
      const passwordEncrypted = crypto
        .createHash('sha256')
        .update(password + saltHex + PEPPER)
        .digest('hex');

      // Begin transaction-like operation
      // 1. Create user (store salt as hex string, not binary)
      const [userResult] = await connection.query(
        'INSERT INTO User (username, password_encrypted, salt_random_value, email, DOB, sex) VALUES (?, ?, ?, ?, ?, ?)',
        [username, passwordEncrypted, saltHex, email, dob, sex]
      );

      console.log(`[Admin Signup] New ${role} created: ${username}, salt_hex: ${saltHex}`);

      // 2. Create developer or admin record
      if (role === 'developer') {
        await connection.query(
          'INSERT INTO developer (username, role, contact) VALUES (?, ?, ?)',
          [username, 'Programmer', email] // Default role is Programmer
        );
      } else if (role === 'admin') {
        await connection.query(
          'INSERT INTO admin (username) VALUES (?)',
          [username]
        );
      }

      console.log(`[Admin Signup] New ${role} created: ${username}`);

      return NextResponse.json({
        success: true,
        message: `New ${role} account created successfully`,
        username,
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('[Admin Signup] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    );
  }
}
