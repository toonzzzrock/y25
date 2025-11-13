import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { pool } from "@/lib/db";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    // Get user from database
    const [userRows] = await pool.query<RowDataPacket[]>(
      `SELECT u.username, u.password_encrypted, u.salt_random_value
       FROM \`User\` u
       WHERE u.username = ?`,
      [username]
    );

    if (userRows.length === 0) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    const user = userRows[0] as RowDataPacket & {
      password_encrypted: string;
      salt_random_value: Buffer;
    };

    // Verify password
    const salt = user.salt_random_value;
    const hashedPassword = crypto
      .createHash("sha256")
      .update(password + salt.toString("utf8"))
      .digest("hex");

    if (hashedPassword !== user.password_encrypted) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    // Check if user is admin
    const [adminRows] = await pool.query<RowDataPacket[]>(
      `SELECT username FROM \`admin\` WHERE username = ?`,
      [username]
    );

    if (adminRows.length === 0) {
      return NextResponse.json(
        { error: "You do not have admin privileges" },
        { status: 403 }
      );
    }

    // Create response with session cookie
    const response = NextResponse.json(
      { success: true, username },
      { status: 200 }
    );

    // Set session cookie (httpOnly, secure in production)
    response.cookies.set("admin_session", username, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60, // 24 hours
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "An error occurred during login" },
      { status: 500 }
    );
  }
}
