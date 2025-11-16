import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import type { RowDataPacket } from "mysql2";
import { callProcedure } from "@/lib/db";

interface StatusResult extends RowDataPacket {
  affected: number;
  message: string;
}

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
    const result = await callProcedure<StatusResult>(
      'sp_admin_update_game_status',
      [id, status, adminUsername]
    );

    if (!result || result.length === 0 || result[0].affected === 0) {
      return NextResponse.json({ success: false, error: "Game not found" }, { status: 404 });
    }

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

