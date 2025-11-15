import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { pool } from "@/lib/db";
import crypto from "crypto";

// Pepper value - must match the one used in y25-design
const PEPPER = process.env.PEPPER_KEY || 'default-pepper-change-in-production';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    console.log("[DEV LOGIN] Attempt with username:", username);

    if (!username || !password) {
      console.log("[DEV LOGIN] Missing username or password");
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    // Get user from database
    console.log("[DEV LOGIN] Querying User table for:", username);
    const [userRows] = await pool.query<RowDataPacket[]>(
      `SELECT u.username, u.password_encrypted, u.salt_random_value
       FROM \`User\` u
       WHERE u.username = ?`,
      [username]
    );

    console.log("[DEV LOGIN] User rows found:", userRows.length);

    if (userRows.length === 0) {
      console.log("[DEV LOGIN] User not found:", username);
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
    let salt = user.salt_random_value;
    console.log("[DEV LOGIN] Salt type:", typeof salt, "Salt:", salt);
    
    // Convert salt from Buffer to proper format
    if (salt instanceof Buffer) {
      const saltStr = salt.toString('utf-8');
      console.log("[DEV LOGIN] Salt as UTF-8 string:", saltStr);
      
      // Check if it looks like a hex string
      if (/^[0-9a-f]{64}$/i.test(saltStr)) {
        console.log("[DEV LOGIN] Detected as hex string in buffer, converting from hex");
        salt = Buffer.from(saltStr, 'hex');
      }
    }
    
    console.log("[DEV LOGIN] Final salt (hex):", salt.toString('hex'));
    
    // Use the same hashing method: salt.toString('hex') + PEPPER
    const hashedPassword = crypto
      .createHash("sha256")
      .update(password + salt.toString("hex") + PEPPER)
      .digest("hex");

    console.log("[DEV LOGIN] Hashed password matches:", hashedPassword === user.password_encrypted);

    if (hashedPassword !== user.password_encrypted) {
      console.log("[DEV LOGIN] Password mismatch for user:", username);
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    // Check if user is admin
    console.log("[DEV LOGIN] Checking admin status for:", username);
    const [adminRows] = await pool.query<RowDataPacket[]>(
      `SELECT username FROM \`admin\` WHERE username = ?`,
      [username]
    );

    console.log("[DEV LOGIN] Admin rows found:", adminRows.length);

    if (adminRows.length === 0) {
      console.log("[DEV LOGIN] User is not admin:", username);
      return NextResponse.json(
        { error: "You do not have admin privileges" },
        { status: 403 }
      );
    }

    // Create response with session cookie
    console.log("[DEV LOGIN] Login successful for:", username);
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
    console.error("[DEV LOGIN] Error:", error);
    return NextResponse.json(
      { error: "An error occurred during login" },
      { status: 500 }
    );
  }
}
