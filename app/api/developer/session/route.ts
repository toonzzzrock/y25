import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  const adminSession = cookieStore.get("admin_session");

  if (!adminSession) {
    return NextResponse.json(
      { authenticated: false },
      { status: 200 }
    );
  }

  return NextResponse.json(
    { authenticated: true, username: adminSession.value },
    { status: 200 }
  );
}
