import { callProcedure } from '@/lib/db';

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

    // Check if username exists in database via procedure
    const rows: any[] = await callProcedure<any[]>('sp_check_username', [username]);
    const count = Array.isArray(rows) && rows[0]?.count != null ? Number(rows[0].count) : 0;
    const available = count === 0;

    return Response.json({ available });
  } catch (error) {
    console.error('Error checking username:', error);
    return Response.json(
      { error: 'Failed to check username availability' },
      { status: 500 }
    );
  }
}
