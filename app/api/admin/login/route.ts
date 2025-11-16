import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { callProcedure } from "@/lib/db";
import crypto from "crypto";

// Pepper value - must match the one used in y25-design
const PEPPER = process.env.PEPPER_KEY || 'default-pepper-change-in-production';

interface UserAuth extends RowDataPacket {
  username: string;
  password_encrypted: string;
  salt_random_value: Buffer;
}

interface AdminCheck extends RowDataPacket {
  username: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    console.log("[LOGIN] Attempt with username:", username);

    if (!username || !password) {
      console.log("[LOGIN] Missing username or password");
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    // Get user from database
    console.log("[LOGIN] Querying User table for:", username);
    const userRows = await callProcedure<UserAuth>('sp_admin_validate_login', [username]);

    console.log("[LOGIN] User rows found:", userRows.length);

    if (userRows.length === 0) {
      console.log("[LOGIN] User not found:", username);
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    const user = userRows[0];

    // Verify password
    let salt = user.salt_random_value;
    console.log("[LOGIN] Salt type:", typeof salt, "Salt:", salt);
    
    // Convert salt from Buffer to proper format
    // The salt is stored as a hex string in the database, but MySQL returns it as Buffer
    // We need to interpret the buffer bytes as UTF-8 string to get the hex string back
    if (salt instanceof Buffer) {
      const saltStr = salt.toString('utf-8');
      console.log("[LOGIN] Salt as UTF-8 string:", saltStr);
      
      // Check if it looks like a hex string (64 hex characters = 32 bytes)
      if (/^[0-9a-f]{64}$/i.test(saltStr)) {
        console.log("[LOGIN] Detected as hex string in buffer, converting from hex");
        salt = Buffer.from(saltStr, 'hex');
      }
    }
    
    console.log("[LOGIN] Final salt (hex):", salt.toString('hex'));
    
    // Use the same hashing method as y25-design: salt.toString('hex') + PEPPER
    const hashedPassword = crypto
      .createHash("sha256")
      .update(password + salt.toString("hex") + PEPPER)
      .digest("hex");

    console.log("[LOGIN] Hashed password matches:", hashedPassword === user.password_encrypted);
    console.log("[LOGIN] Expected:", user.password_encrypted);
    console.log("[LOGIN] Got:", hashedPassword);
    console.log("[LOGIN] Using PEPPER:", PEPPER);

    if (hashedPassword !== user.password_encrypted) {
      console.log("[LOGIN] Password mismatch for user:", username);
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    // Check if user is admin
    console.log("[LOGIN] Checking admin status for:", username);
    const adminRows = await callProcedure<AdminCheck>('sp_admin_check_privileges', [username]);

    console.log("[LOGIN] Admin rows found:", adminRows.length);

    if (adminRows.length === 0) {
      console.log("[LOGIN] User is not admin:", username);
      return NextResponse.json(
        { error: "You do not have admin privileges" },
        { status: 403 }
      );
    }

    // Create response with session cookie
    console.log("[LOGIN] Login successful for:", username);
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
    console.error("[LOGIN] Error:", error);
    return NextResponse.json(
      { error: "An error occurred during login" },
      { status: 500 }
    );
  }
}
