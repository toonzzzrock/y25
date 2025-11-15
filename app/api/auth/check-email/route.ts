import { callProcedure } from '@/lib/db';

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

    // Check if email exists in database via procedure
    const rows: any[] = await callProcedure<any[]>('sp_check_email', [email]);
    const count = Array.isArray(rows) && rows[0]?.count != null ? Number(rows[0].count) : 0;
    const available = count === 0;

    return Response.json({ available });
  } catch (error) {
    console.error('Error checking email:', error);
    return Response.json(
      { error: 'Failed to check email availability' },
      { status: 500 }
    );
  }
}
