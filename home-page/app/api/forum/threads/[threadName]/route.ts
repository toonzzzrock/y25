/**
 * Forum Thread Detail API Route
 * GET /api/forum/threads/[threadName]
 * Returns a single forum thread with creator info and replies.
 */

import { NextRequest, NextResponse } from 'next/server';
import { callProcedure } from '@/lib/db';

type ThreadRouteContext =
  | { params: Promise<{ threadName: string }> }
  | { params: { threadName: string } };

async function extractThreadName(context: ThreadRouteContext): Promise<string> {
  const params = await (context.params as any);
  const rawName: string | undefined = params?.threadName;

  if (!rawName) {
    return '';
  }

  try {
    return decodeURIComponent(rawName);
  } catch {
    return rawName;
  }
}

function getSessionUser(request: NextRequest): { username: string; email?: string | null } | null {
  const token = request.cookies.get('auth_session')?.value;
  if (!token) {
    return null;
  }

  try {
    const session = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
    if (!session?.username) {
      return null;
    }
    return { username: session.username, email: session.email ?? null };
  } catch (error) {
    console.error('Session parse error:', error);
    return null;
  }
}

export async function POST(request: NextRequest, context: ThreadRouteContext) {
  const decodedName = await extractThreadName(context);

  if (!decodedName) {
    return NextResponse.json(
      { error: 'Thread name required' },
      { status: 400 }
    );
  }

  const session = getSessionUser(request);
  if (!session) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const rawCommentText: unknown = body?.commentText;
    const replyToCommentIdRaw: unknown = body?.replyToCommentId;

    if (typeof rawCommentText !== 'string' || rawCommentText.trim().length === 0) {
      return NextResponse.json(
        { error: 'Comment text required' },
        { status: 400 }
      );
    }

    const commentText = rawCommentText.trim();

    if (commentText.length > 1500) {
      return NextResponse.json(
        { error: 'Comment text is too long' },
        { status: 400 }
      );
    }

    const replyToCommentId =
      typeof replyToCommentIdRaw === 'number' || typeof replyToCommentIdRaw === 'string'
        ? Number(replyToCommentIdRaw) || null
        : null;

    const threadRows = await callProcedure<any[]>('sp_check_thread_exists', [decodedName]);
    if (!Array.isArray(threadRows) || threadRows.length === 0) {
      return NextResponse.json(
        { error: 'Thread not found' },
        { status: 404 }
      );
    }

    if (replyToCommentId !== null) {
      const replyTarget = await callProcedure<any[]>('sp_check_reply_to_comment', [decodedName, replyToCommentId]);
      if (!Array.isArray(replyTarget) || replyTarget.length === 0) {
        return NextResponse.json(
          { error: 'Reply target not found' },
          { status: 404 }
        );
      }
    }

    const insertedComment = await callProcedure<any[]>('sp_create_comment', [commentText]);
    const commentId = Number(insertedComment?.[0]?.comment_id ?? insertedComment?.[0]?.last_insert_id ?? 0);
    if (!Number.isFinite(commentId) || commentId <= 0) {
      throw new Error('Invalid comment id returned');
    }

    await callProcedure('sp_create_reply', [decodedName, session.username, commentId, replyToCommentId]);

    const replies = await callProcedure<any[]>('sp_get_thread_replies', [decodedName]);
    const inserted = Array.isArray(replies)
      ? replies.find((row) => Number(row.comment_id ?? row.commentId ?? 0) === commentId)
      : null;

    const createdAtValue = inserted?.created_at
      ? new Date(inserted.created_at).toISOString()
      : new Date().toISOString();

    const newComment = {
      commentId,
      replyToCommentId: inserted?.reply_to_comment_id ?? replyToCommentId ?? null,
      username: inserted?.username ?? session.username,
      commentText: inserted?.comment_text ?? commentText,
      createdAt: createdAtValue,
    };

    return NextResponse.json(
      { success: true, comment: newComment },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Thread reply creation error:', error);
    return NextResponse.json(
      { error: 'Failed to post reply' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  context: ThreadRouteContext
) {
  try {
    const decodedName = await extractThreadName(context);

    if (!decodedName) {
      return NextResponse.json(
        { error: 'Thread name required' },
        { status: 400 }
      );
    }

    const threadRows = await callProcedure<any[]>('sp_get_thread_details', [decodedName]);
    if (!Array.isArray(threadRows) || threadRows.length === 0) {
      return NextResponse.json(
        { error: 'Thread not found', thread: null },
        { status: 404 }
      );
    }

    const replyRows = await callProcedure<any[]>('sp_get_thread_replies', [decodedName]);
    const threadRecord = threadRows[0] as any;

    const comments = Array.isArray(replyRows)
      ? replyRows.map((row) => ({
          commentId: row.comment_id,
          replyToCommentId: row.reply_to_comment_id,
          username: row.username,
          commentText: row.comment_text,
          createdAt: row.created_at,
        }))
      : [];

    return NextResponse.json(
      {
        thread: {
          threadName: threadRecord.thread_name,
          detail: threadRecord.detail,
          createdAt: threadRecord.created_at,
          creatorUsername: threadRecord.creator_username ?? null,
          gameId: threadRecord.game_id ?? null,
          gameName: threadRecord.game_name ?? null,
          comments,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Forum thread detail error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch thread detail', thread: null },
      { status: 500 }
    );
  }
}
