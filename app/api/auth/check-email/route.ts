import { pool } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return Response.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if email exists in database
    const [rows] = await pool.query(
      'SELECT * FROM `User` WHERE email = ?',
      [email]
    );

    const available = (rows as any[]).length === 0;

    return Response.json({ available });
  } catch (error) {
    console.error('Error checking email:', error);
    return Response.json(
      { error: 'Failed to check email availability' },
      { status: 500 }
    );
  }
}
