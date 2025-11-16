/**
 * Admin signup endpoint
 * Creates new user, developer, or admin accounts
 */

import { NextResponse } from 'next/server';
import { callProcedure } from '@/lib/db';
import crypto from 'crypto';
import type { RowDataPacket } from 'mysql2';

// Pepper value - must match the one used in login and y25-design
const PEPPER = process.env.PEPPER_KEY;

interface UserExists extends RowDataPacket {
  username: string;
}

interface CreateResult extends RowDataPacket {
  user_id: number;
  username: string;
}

interface ActionResult extends RowDataPacket {
  affected: number;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, email, password, dob, sex, role, developerRole } = body;

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

    // Only allow developer role creation (admins cannot create other admins)
    if (role !== 'developer') {
      return NextResponse.json(
        { error: 'Only developer accounts can be created' },
        { status: 400 }
      );
    }

    // Validate developer role
    const validDeveloperRoles = ['Tester', 'Designer', 'Programmer'];
    if (!developerRole || !validDeveloperRoles.includes(developerRole)) {
      return NextResponse.json(
        { error: 'Invalid developer role. Must be Tester, Designer, or Programmer' },
        { status: 400 }
      );
    }

    try {
      // Check if user already exists
      const existingUser = await callProcedure<UserExists>(
        'sp_admin_check_user_exists',
        [username, email]
      );

      if (existingUser.length > 0) {
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

      // Create user
      const userResult = await callProcedure<CreateResult>(
        'sp_admin_create_user',
        [username, passwordEncrypted, saltHex, email, dob, sex]
      );

      console.log(`[Admin Signup] New developer created: ${username}, salt_hex: ${saltHex}`);

      // Create developer record with specified role
      await callProcedure<ActionResult>(
        'sp_admin_create_developer',
        [username, email, developerRole]
      );

      console.log(`[Admin Signup] New developer (${developerRole}) created: ${username}`);

      return NextResponse.json({
        success: true,
        message: `New developer account created successfully`,
        username,
      });
    } catch (error) {
      console.error('[Admin Signup] Error:', error);
      return NextResponse.json(
        { error: 'Failed to create account' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[Admin Signup] Request error:', error);
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }
}
