/**
 * Example API Route showing proper environment variable usage
 * 
 * Endpoint: GET /api/users
 * Response: List of all users from the database
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAllUsers } from '@/lib/db';
import { env } from '@/lib/env';

export async function GET(request: NextRequest) {
  try {
    // Environment variables are available in all server-side contexts
    console.log(`Connected to database: ${env.MYSQL_DATABASE}`);
    
    // Call database function
    const users = await getAllUsers();
    
    return NextResponse.json({
      success: true,
      data: users,
      count: users.length,
    });
  } catch (error) {
    console.error('Database error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch users',
      },
      { status: 500 }
    );
  }
}
