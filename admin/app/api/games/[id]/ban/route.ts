import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import type { RowDataPacket } from "mysql2";
import { callProcedure } from "@/lib/db";

interface BanResult extends RowDataPacket {
  affected: number;
  message: string;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idStr } = await params;
  const id = Number.parseInt(idStr, 10);

  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json(
      { success: false, error: "Invalid game id" },
      { status: 400 }
    );
  }

  try {
    const result = await callProcedure<BanResult>('sp_admin_ban_game', [id]);

    if (!result || result.length === 0 || result[0].affected === 0) {
      return NextResponse.json(
        { success: false, error: "Game not found" },
        { status: 404 }
      );
    }

    revalidatePath("/admin");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to ban game", error);
    return NextResponse.json(
      { success: false, error: "Failed to ban game" },
      { status: 500 }
    );
  }
}
