import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
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
    // Delete related records in reverse order of dependencies
    // create_relation table references publisher.username but has no ON DELETE CASCADE
    await pool.query(
      "DELETE FROM `create_relation` WHERE username = ?",
      [username]
    );

    // Delete games published by this publisher
    // (game.publisher_username has ON DELETE CASCADE, but we delete explicitly for clarity)
    const [games] = await pool.query<RowDataPacket[]>(
      "SELECT game_id FROM `game` WHERE publisher_username = ?",
      [username]
    );

    for (const gameRow of games) {
      const gameId = Number(gameRow.game_id ?? 0);
      if (gameId > 0) {
        // Delete dependent records for each game
        await pool.query("DELETE FROM `tag` WHERE game_id = ?", [gameId]);
        await pool.query("DELETE FROM `play` WHERE game_id = ?", [gameId]);
        await pool.query(
          "DELETE FROM `game_update_history` WHERE game_id = ?",
          [gameId]
        );
        await pool.query("DELETE FROM `game` WHERE game_id = ?", [gameId]);
      }
    }

    // Delete from reply table (User reference without ON DELETE CASCADE)
    await pool.query("DELETE FROM `reply` WHERE username = ?", [username]);

    // Delete from report table (User reference without ON DELETE CASCADE)
    await pool.query("DELETE FROM `report` WHERE username = ?", [username]);

    // Now delete the publisher
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

    // Also delete from User table since a publisher is also a user
    await pool.query("DELETE FROM `User` WHERE username = ?", [username]);

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
