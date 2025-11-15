import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    console.log("[DEVELOPER LOGOUT] Logout requested");

    const response = NextResponse.json(
      { success: true, message: "Logged out successfully" },
      { status: 200 }
    );

    // Clear the developer_session cookie
    response.cookies.delete("developer_session");

    console.log("[DEVELOPER LOGOUT] Session cookie cleared");

    return response;
  } catch (error) {
    console.error("[DEVELOPER LOGOUT] Error:", error);
    return NextResponse.json(
      { error: "An error occurred during logout" },
      { status: 500 }
    );
  }
}
