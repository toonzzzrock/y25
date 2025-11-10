import { pool } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    if (!username) {
      return Response.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    // Check if username exists in database
    const [rows] = await pool.query(
      'SELECT * FROM `User` WHERE username = ?',
      [username]
    );

    const available = (rows as any[]).length === 0;

    return Response.json({ available });
  } catch (error) {
    console.error('Error checking username:', error);
    return Response.json(
      { error: 'Failed to check username availability' },
      { status: 500 }
    );
  }
}
