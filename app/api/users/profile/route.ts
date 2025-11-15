/**
 * User Profile API Route
 * GET /api/users/profile - returns the authenticated user's profile
 * PUT /api/users/profile - updates the authenticated user's profile
 */

import { NextRequest, NextResponse } from 'next/server';
import { callProcedure } from '@/lib/db';
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
    const profileRows = await callProcedure<any[]>('sp_get_user_profile', [session.username]);
    if (!Array.isArray(profileRows) || profileRows.length === 0) {
      return NextResponse.json(
        { error: 'User not found', profile: null },
        { status: 404 }
      );
    }

    const record = profileRows[0] as any;
    const assets = await resolveUserAssets(record.username);
    const playRows = await callProcedure<any[]>('sp_get_user_playtime', [session.username]);
    const totalRows = await callProcedure<any[]>('sp_get_user_total_playtime', [session.username]);

    const totalSecondsRaw = Array.isArray(totalRows) && totalRows.length > 0
      ? (totalRows[0] as any)?.totalSeconds
      : 0;
    const totalSeconds = Number(totalSecondsRaw ?? 0);

    const topGames = Array.isArray(playRows)
      ? playRows.map((row) => {
          const rawGameId = Number(row.gameId ?? row.game_id ?? 0);
          const cleanGameId = Number.isFinite(rawGameId) && rawGameId > 0 ? rawGameId : 0;
          const rawSeconds = Number(row.playSeconds ?? row.play_seconds ?? 0);
          const cleanSeconds = Number.isFinite(rawSeconds) && rawSeconds > 0 ? rawSeconds : 0;

          return {
            gameId: cleanGameId,
            gameName: typeof row.gameName === 'string' ? row.gameName : row.game_name ?? null,
            playSeconds: cleanSeconds,
          };
        })
      : [];

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
        playStats: {
          totalSeconds: Number.isFinite(totalSeconds) && totalSeconds >= 0 ? totalSeconds : 0,
          topGames,
        },
      },
      { status: 200 }
    );
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

    const hasEmail = typeof rawEmail === 'string' && rawEmail.trim().length > 0;
    const hasDob = typeof rawDateOfBirth === 'string' && rawDateOfBirth.trim().length > 0;
    const hasSex = typeof rawSex === 'string' && rawSex.trim().length > 0;

    if (!hasEmail && !hasDob && !hasSex) {
      return NextResponse.json(
        { error: 'No profile changes provided', profile: null },
        { status: 400 }
      );
    }

    const profileRows = await callProcedure<any[]>('sp_get_user_profile', [session.username]);
    if (!Array.isArray(profileRows) || profileRows.length === 0) {
      return NextResponse.json(
        { error: 'User not found', profile: null },
        { status: 404 }
      );
    }

    const existing = profileRows[0] as any;
    let emailValue: string | null = existing.email ?? null;
    let dobValue: string | null = existing.dateOfBirth ?? null;
    let sexValue: string | null = existing.sex ?? null;

    if (hasEmail) {
      const trimmedEmail = (rawEmail as string).trim();
      if (!validateEmail(trimmedEmail)) {
        return NextResponse.json(
          { error: 'Invalid email address', profile: null },
          { status: 400 }
        );
      }

      const emailCheck = await callProcedure<any[]>('sp_check_email_exists', [trimmedEmail, session.username]);
      if (Array.isArray(emailCheck) && emailCheck.length > 0 && Number(emailCheck[0]?.count ?? 0) > 0) {
        return NextResponse.json(
          { error: 'Email already in use', profile: null },
          { status: 409 }
        );
      }

      emailValue = trimmedEmail;
    }

    if (hasDob) {
      const parsedDate = new Date(rawDateOfBirth as string);
      if (Number.isNaN(parsedDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid date of birth', profile: null },
          { status: 400 }
        );
      }

      dobValue = parsedDate.toISOString().slice(0, 10);
    }

    if (hasSex) {
      const normalizedSex = (rawSex as string).trim();
      const allowed = ['Male', 'Female', 'Other'];
      if (!allowed.includes(normalizedSex)) {
        return NextResponse.json(
          { error: 'Invalid gender selection', profile: null },
          { status: 400 }
        );
      }

      sexValue = normalizedSex;
    }

    await callProcedure('sp_update_user_profile', [session.username, emailValue, dobValue, sexValue]);

    const updatedRows = await callProcedure<any[]>('sp_get_user_profile', [session.username]);
    if (!Array.isArray(updatedRows) || updatedRows.length === 0) {
      return NextResponse.json(
        { error: 'User not found after update', profile: null },
        { status: 404 }
      );
    }

    const updatedRecord = updatedRows[0] as any;
    const assets = await resolveUserAssets(updatedRecord.username);
    const updatedEmail = updatedRecord.email as string | null;

    const response = NextResponse.json(
      {
        profile: {
          username: updatedRecord.username,
          email: updatedEmail,
          dateOfBirth: updatedRecord.dateOfBirth ?? null,
          sex: updatedRecord.sex ?? null,
          createdAt: updatedRecord.createdAt ?? null,
          avatarUrl: assets.avatarUrl,
          description: assets.description,
        },
      },
      { status: 200 }
    );

    const sessionPayload = {
      username: updatedRecord.username,
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
  } catch (error: any) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile', profile: null },
      { status: 500 }
    );
  }
}
