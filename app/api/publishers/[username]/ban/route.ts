import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import type { ResultSetHeader } from "mysql2";
import { pool } from "@/lib/db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  if (!username || typeof username !== "string") {
    return NextResponse.json(
      { success: false, error: "Invalid username" },
      { status: 400 }
    );
  }

  try {
    const [result] = await pool.query<ResultSetHeader>(
      "DELETE FROM `publisher` WHERE username = ?",
      [username]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { success: false, error: "Publisher not found" },
        { status: 404 }
      );
    }

    revalidatePath("/admin");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to ban publisher", error);
    return NextResponse.json(
      { success: false, error: "Failed to ban publisher" },
      { status: 500 }
    );
  }
}
