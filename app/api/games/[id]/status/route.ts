import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import type { ResultSetHeader } from "mysql2";
import { pool } from "@/lib/db";

const ALLOWED_STATUSES = new Set([
  "Approve",
  "Approved",
  "Reject",
  "Rejected",
  "Pending",
  "Published",
]);

const STATUS_MAP: Record<string, string> = {
  Approved: "Approve",
  Rejected: "Reject",
  Published: "Approve",
  Banned: "Reject",
};

function normalizeStatus(status: string): string {
  const mapped = STATUS_MAP[status];
  if (mapped) return mapped;
  if (ALLOWED_STATUSES.has(status)) return status;
  throw new Error(`Unsupported status value: ${status}`);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idStr } = await params;
  const id = Number.parseInt(idStr, 10);

  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ success: false, error: "Invalid game id" }, { status: 400 });
  }

  // Get admin username from session
  const cookieStore = await cookies();
  const adminSession = cookieStore.get("admin_session");
  
  if (!adminSession) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const adminUsername = adminSession.value;

  let body: unknown;
  try {
    body = await request.json();
  } catch (error) {
    return NextResponse.json({ success: false, error: "Invalid JSON payload" }, { status: 400 });
  }

  const statusInput =
    typeof body === "object" && body !== null
      ? (body as { status?: string }).status
      : undefined;

  if (!statusInput) {
    return NextResponse.json({ success: false, error: "Missing status field" }, { status: 400 });
  }

  let status: string;
  try {
    status = normalizeStatus(statusInput);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid status";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }

  try {
    const [result] = await pool.query<ResultSetHeader>(
      "UPDATE `game` SET status = ? WHERE game_id = ?",
      [status, id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ success: false, error: "Game not found" }, { status: 404 });
    }

    // Record in game_update_history
    await pool.query(
      `INSERT INTO \`game_update_history\` (patch_number, title, detail, link_to_new_file, is_approve, approve_time, approve_by, game_id)
       VALUES (?, ?, ?, ?, ?, NOW(), ?, ?)`,
      [
        "admin-review",
        `Game ${status === "Approve" ? "Approved" : "Rejected"}`,
        `Admin review: ${status === "Approve" ? "Approved" : "Rejected"}`,
        "",
        status === "Approve" ? "Approve" : "Reject",
        adminUsername,
        id,
      ]
    );

    revalidatePath("/admin");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update game status", error);
    return NextResponse.json(
      { success: false, error: "Failed to update game status" },
      { status: 500 }
    );
  }
}

