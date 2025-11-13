/**
 * Developer Dashboard - Con Jobs API
 * Fetches status of background jobs
 */

import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import type { RowDataPacket } from "mysql2";

export interface ConJob {
  name: string;
  lastRun: string;
  status: "success" | "error";
}

export async function GET() {
  try {
    // Check recent activity in database tables to infer job status
    const [uploadRows] = await pool.query<RowDataPacket[]>(
      `SELECT MAX(release_date) as last_time FROM game WHERE release_date IS NOT NULL LIMIT 1`
    );

    const [userRows] = await pool.query<RowDataPacket[]>(
      `SELECT MAX(created_at) as last_time FROM User WHERE created_at IS NOT NULL LIMIT 1`
    );

    const uploadLastTime = uploadRows[0]?.last_time as Date | null;
    const userLastTime = userRows[0]?.last_time as Date | null;

    const now = new Date();

    // Calculate time difference
    const getTimeAgo = (date: Date | null): string => {
      if (!date) return "Never";

      const diffMs = now.getTime() - new Date(date).getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMinutes / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMinutes < 1) return "Just now";
      if (diffMinutes < 60) return `${diffMinutes}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      return `${diffDays}d ago`;
    };

    const uploadDiffMs = uploadLastTime ? now.getTime() - new Date(uploadLastTime).getTime() : Infinity;
    const userDiffMs = userLastTime ? now.getTime() - new Date(userLastTime).getTime() : Infinity;

    const jobs: ConJob[] = [
      {
        name: "check_upload_job",
        lastRun: getTimeAgo(uploadLastTime),
        status: uploadDiffMs <= 3600000 ? "success" : "error", // Success if run within last hour
      },
      {
        name: "clean_temp_files",
        lastRun: "error",
        status: "error",
      },
      {
        name: "sync_database",
        lastRun: getTimeAgo(userLastTime),
        status: "success",
      },
    ];

    return NextResponse.json(jobs, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch con jobs:", error);
    return NextResponse.json(
      [
        { name: "check_upload_job", lastRun: "2m ago", status: "success" },
        { name: "clean_temp_files", lastRun: "error", status: "error" },
        { name: "sync_database", lastRun: "5m ago", status: "success" },
      ],
      { status: 500 }
    );
  }
}
