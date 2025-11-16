import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import type { RowDataPacket } from "mysql2";
import { callProcedure } from "@/lib/db";

interface BanResult extends RowDataPacket {
  affected: number;
  message: string;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  // Check admin authentication
  const cookieStore = await cookies();
  const adminSession = cookieStore.get("admin_session");
  
  if (!adminSession) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { username } = await params;

  if (!username || typeof username !== "string") {
    return NextResponse.json(
      { success: false, error: "Invalid username" },
      { status: 400 }
    );
  }

  try {
    const result = await callProcedure<BanResult>('sp_admin_ban_user', [username]);

    if (!result || result.length === 0 || result[0].affected === 0) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    revalidatePath("/admin");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to ban user", error);
    return NextResponse.json(
      { success: false, error: "Failed to ban user" },
      { status: 500 }
    );
  }
}
