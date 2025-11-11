/**
 * User Search API Route
 * GET /api/users/search?q=query
 * Returns users matching the search query from the database
 */

import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim();

    if (!query || query.length < 2) {
      return NextResponse.json(
        { users: [], error: 'Query must be at least 2 characters' },
        { status: 400 }
      );
    }

    const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 25);

    const connection = await pool.getConnection();
    try {
      const likeQuery = `%${query}%`;

      const [rows] = await connection.query(
        `SELECT username, email, created_at
         FROM \`User\`
         WHERE username LIKE ?
            OR email LIKE ?
         ORDER BY created_at DESC
         LIMIT ?`,
        [likeQuery, likeQuery, limit]
      );

      return NextResponse.json(
        { users: rows || [] },
        { status: 200 }
      );
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error('User search error:', error);
    return NextResponse.json(
      { error: 'Failed to search users', users: [] },
      { status: 500 }
    );
  }
}
