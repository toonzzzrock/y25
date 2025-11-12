/**
 * User Profile API Route
 * GET /api/users/profile - returns the authenticated user's profile
 * PUT /api/users/profile - updates the authenticated user's profile
 */

import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { validateEmail } from '@/lib/auth';
import { resolveUserAssets } from '@/lib/user-assets';

type SessionUser = {
  username: string;
  email?: string | null;
  role?: string | null;
};

function getSessionUser(request: NextRequest): SessionUser | null {
  const rawToken = request.cookies.get('auth_session')?.value;
  if (!rawToken) {
    return null;
  }

  try {
    const decoded = JSON.parse(Buffer.from(rawToken, 'base64').toString('utf-8'));
    if (!decoded?.username) {
      return null;
    }

    return {
      username: decoded.username,
      email: decoded.email ?? null,
      role: decoded.role ?? null,
    };
  } catch (error) {
    console.error('Profile session parse error:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  const session = getSessionUser(request);

  if (!session) {
    return NextResponse.json(
      { error: 'Authentication required', profile: null },
      { status: 401 }
    );
  }

  try {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        `SELECT username, email, DOB AS dateOfBirth, sex, created_at AS createdAt
         FROM User
         WHERE username = ?
         LIMIT 1`,
        [session.username]
      );

      if (!Array.isArray(rows) || rows.length === 0) {
        return NextResponse.json(
          { error: 'User not found', profile: null },
          { status: 404 }
        );
      }

      const record = rows[0] as any;
      const assets = await resolveUserAssets(record.username);

      return NextResponse.json(
        {
          profile: {
            username: record.username,
            email: record.email,
            dateOfBirth: record.dateOfBirth ?? null,
            sex: record.sex ?? null,
            createdAt: record.createdAt ?? null,
            avatarUrl: assets.avatarUrl,
            description: assets.description,
          },
        },
        { status: 200 }
      );
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to load profile', profile: null },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const session = getSessionUser(request);

  if (!session) {
    return NextResponse.json(
      { error: 'Authentication required', profile: null },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const rawEmail: unknown = body?.email;
    const rawDateOfBirth: unknown = body?.dateOfBirth;
    const rawSex: unknown = body?.sex;

    const updates: string[] = [];
    const params: any[] = [];

    if (typeof rawEmail === 'string' && rawEmail.trim().length > 0) {
      const trimmedEmail = rawEmail.trim();
      if (!validateEmail(trimmedEmail)) {
        return NextResponse.json(
          { error: 'Invalid email address', profile: null },
          { status: 400 }
        );
      }
      updates.push('email = ?');
      params.push(trimmedEmail);
    }

    if (typeof rawDateOfBirth === 'string' && rawDateOfBirth.trim().length > 0) {
      const parsedDate = new Date(rawDateOfBirth);
      if (Number.isNaN(parsedDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid date of birth', profile: null },
          { status: 400 }
        );
      }
      const iso = parsedDate.toISOString().slice(0, 10);
      updates.push('DOB = ?');
      params.push(iso);
    }

    if (typeof rawSex === 'string' && rawSex.trim().length > 0) {
      const normalizedSex = rawSex.trim();
      const allowed = ['Male', 'Female', 'Other'];
      if (!allowed.includes(normalizedSex)) {
        return NextResponse.json(
          { error: 'Invalid gender selection', profile: null },
          { status: 400 }
        );
      }
      updates.push('sex = ?');
      params.push(normalizedSex);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No profile changes provided', profile: null },
        { status: 400 }
      );
    }

    const connection = await pool.getConnection();
    try {
      if (updates.some((fragment) => fragment.startsWith('email'))) {
        const [existing] = await connection.query(
          'SELECT username FROM User WHERE email = ? AND username <> ? LIMIT 1',
          [params[updates.indexOf('email = ?')], session.username]
        );

        if (Array.isArray(existing) && existing.length > 0) {
          return NextResponse.json(
            { error: 'Email already in use', profile: null },
            { status: 409 }
          );
        }
      }

      await connection.query(
        `UPDATE User
         SET ${updates.join(', ')}
         WHERE username = ?
         LIMIT 1`,
        [...params, session.username]
      );

      const [rows] = await connection.query(
        `SELECT username, email, DOB AS dateOfBirth, sex, created_at AS createdAt
         FROM User
         WHERE username = ?
         LIMIT 1`,
        [session.username]
      );

      if (!Array.isArray(rows) || rows.length === 0) {
        return NextResponse.json(
          { error: 'User not found after update', profile: null },
          { status: 404 }
        );
      }

      const record = rows[0] as any;
      const assets = await resolveUserAssets(record.username);
      const updatedEmail = record.email as string | null;

      const response = NextResponse.json(
        {
          profile: {
            username: record.username,
            email: updatedEmail,
            dateOfBirth: record.dateOfBirth ?? null,
            sex: record.sex ?? null,
            createdAt: record.createdAt ?? null,
            avatarUrl: assets.avatarUrl,
            description: assets.description,
          },
        },
        { status: 200 }
      );

      const sessionPayload = {
        username: record.username,
        email: updatedEmail,
        role: session.role ?? null,
        timestamp: Date.now(),
      };

      response.cookies.set('auth_session', Buffer.from(JSON.stringify(sessionPayload), 'utf-8').toString('base64'), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60,
      });

      return response;
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile', profile: null },
      { status: 500 }
    );
  }
}
