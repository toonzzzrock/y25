/**
 * Signup API Route
 * POST /api/auth/signup
 * Registers a new user in the database
 */

import { NextRequest, NextResponse } from 'next/server';
import { pool, callProcedure } from '@/lib/db';
import { generateSalt, hashPassword, validatePasswordStrength, validateEmail } from '@/lib/auth';
import type { RowDataPacket } from 'mysql2';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      username,
      email,
      dateOfBirth,
      sex,
      password,
      userType,
      bankAccountName,
      bankAccountSerial,
    } = body as {
      username?: string;
      email?: string;
      dateOfBirth?: string;
      sex?: string;
      password?: string;
      userType?: string;
      bankAccountName?: string;
      bankAccountSerial?: string;
    };

    // Validation
    if (!username || !email || !dateOfBirth || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const normalizedSex = sex || '';

    const normalizedUserType: 'user' | 'publisher' = userType === 'publisher' ? 'publisher' : 'user';

    const trimmedBankAccountName = typeof bankAccountName === 'string' ? bankAccountName.trim() : '';
    const trimmedBankAccountSerial = typeof bankAccountSerial === 'string' ? bankAccountSerial.trim() : '';

    if (normalizedUserType === 'publisher') {
      if (!trimmedBankAccountName) {
        return NextResponse.json(
          { error: 'Bank account name is required for publisher accounts' },
          { status: 400 }
        );
      }

      if (!trimmedBankAccountSerial) {
        return NextResponse.json(
          { error: 'Bank account serial number is required for publisher accounts' },
          { status: 400 }
        );
      }
    }

    // Validate email
    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.error },
        { status: 400 }
      );
    }

    // Check for username and email availability
    const connection = await pool.getConnection();
    try {
      const usernameRows = await callProcedure<RowDataPacket[]>('sp_check_username', [username]);
      const usernameCount = (usernameRows[0]?.count as number | undefined) ?? 0;
      if (usernameCount > 0) {
        return NextResponse.json(
          { error: 'Username already taken' },
          { status: 409 }
        );
      }

      const emailRows = await callProcedure<RowDataPacket[]>('sp_check_email', [email]);
      const emailCount = (emailRows[0]?.count as number | undefined) ?? 0;
      if (emailCount > 0) {
        return NextResponse.json(
          { error: 'Email already registered' },
          { status: 409 }
        );
      }

      // Generate salt and hash password
      const salt = generateSalt();
      const hashedPassword = hashPassword(password, salt);

      // Get current timestamp in MySQL format
      const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

      // Insert user (and optionally publisher) via stored procedure
      await callProcedure('sp_register_user_with_optional_publisher', [
        username,
        email,
        dateOfBirth,
        normalizedSex,
        hashedPassword,
        salt.toString('hex'),
        now,
        normalizedUserType === 'publisher',
        trimmedBankAccountName || username,
        trimmedBankAccountSerial,
      ]);

      return NextResponse.json(
        {
          success: true,
          message: 'Account created successfully',
          user: { username }
        },
        { status: 201 }
      );
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Signup error:', error);
    
    // Handle duplicate email
    if (typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === 'ER_DUP_ENTRY') {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    );
  }
}
