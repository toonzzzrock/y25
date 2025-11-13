import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import type { ResultSetHeader } from "mysql2";
import { pool } from "@/lib/db";

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
    // Delete dependent records first
    await pool.query("DELETE FROM `tag` WHERE game_id = ?", [id]);
    await pool.query("DELETE FROM `play` WHERE game_id = ?", [id]);
    await pool.query("DELETE FROM `game_update_history` WHERE game_id = ?", [id]);
    await pool.query("DELETE FROM `report` WHERE game_id = ?", [id]);
    await pool.query("DELETE FROM `create_relation` WHERE game_id = ?", [id]);

    // Delete the game itself
    const [result] = await pool.query<ResultSetHeader>(
      "DELETE FROM `game` WHERE game_id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
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
