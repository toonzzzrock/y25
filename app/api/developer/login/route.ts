import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { pool } from "@/lib/db";
import crypto from "crypto";

// Pepper value - must match the one used in signup
const PEPPER = process.env.PEPPER_KEY || 'default-pepper-change-in-production';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    console.log("[DEVELOPER LOGIN] Attempt with username:", username);

    if (!username || !password) {
      console.log("[DEVELOPER LOGIN] Missing username or password");
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    // Get user from database
    console.log("[DEVELOPER LOGIN] Querying User table for:", username);
    const [userRows] = await pool.query<RowDataPacket[]>(
      `SELECT u.username, u.password_encrypted, u.salt_random_value
       FROM \`User\` u
       WHERE u.username = ?`,
      [username]
    );

    console.log("[DEVELOPER LOGIN] User rows found:", userRows.length);

    if (userRows.length === 0) {
      console.log("[DEVELOPER LOGIN] User not found:", username);
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    const user = userRows[0] as RowDataPacket & {
      password_encrypted: string;
      salt_random_value: Buffer | string;
    };

    // Verify password
    let salt = user.salt_random_value;
    console.log("[DEVELOPER LOGIN] Salt type:", typeof salt);
    
    // Convert salt to hex string if it's a Buffer
    let saltHex = '';
    if (salt instanceof Buffer) {
      saltHex = salt.toString('utf-8');
      console.log("[DEVELOPER LOGIN] Salt as UTF-8 string:", saltHex);
      
      // Check if it looks like a hex string (64 hex characters = 32 bytes)
      if (!/^[0-9a-f]{64}$/i.test(saltHex)) {
        console.log("[DEVELOPER LOGIN] Salt is raw binary data, converting to hex");
        saltHex = salt.toString('hex');
      }
    } else if (typeof salt === 'string') {
      saltHex = salt;
      console.log("[DEVELOPER LOGIN] Salt already a string:", saltHex);
    }
    
    console.log("[DEVELOPER LOGIN] Final salt (hex):", saltHex);
    
    // Use the same hashing method as signup: password + salt_hex + PEPPER
    const hashedPassword = crypto
      .createHash("sha256")
      .update(password + saltHex + PEPPER)
      .digest("hex");

    console.log("[DEVELOPER LOGIN] Hashed password matches:", hashedPassword === user.password_encrypted);
    console.log("[DEVELOPER LOGIN] Expected:", user.password_encrypted);
    console.log("[DEVELOPER LOGIN] Got:", hashedPassword);
    console.log("[DEVELOPER LOGIN] Using PEPPER:", PEPPER);

    if (hashedPassword !== user.password_encrypted) {
      console.log("[DEVELOPER LOGIN] Password mismatch for user:", username);
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    // Check if user is developer
    console.log("[DEVELOPER LOGIN] Checking developer status for:", username);
    const [developerRows] = await pool.query<RowDataPacket[]>(
      `SELECT username FROM \`developer\` WHERE username = ?`,
      [username]
    );

    console.log("[DEVELOPER LOGIN] Developer rows found:", developerRows.length);

    if (developerRows.length === 0) {
      console.log("[DEVELOPER LOGIN] User is not a developer:", username);
      return NextResponse.json(
        { error: "You do not have developer privileges" },
        { status: 403 }
      );
    }

    // Create response with session cookie
    console.log("[DEVELOPER LOGIN] Login successful for:", username);
    const response = NextResponse.json(
      { success: true, username },
      { status: 200 }
    );

    // Set session cookie (httpOnly, secure in production)
    response.cookies.set("developer_session", username, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60, // 24 hours
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("[DEVELOPER LOGIN] Error:", error);
    return NextResponse.json(
      { error: "An error occurred during login" },
      { status: 500 }
    );
  }
}
