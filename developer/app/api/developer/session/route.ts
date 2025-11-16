import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const developerSessionCookie = request.cookies.get("developer_session");

    if (developerSessionCookie) {
      console.log("[DEVELOPER SESSION] User is authenticated:", developerSessionCookie.value);
      return NextResponse.json(
        { authenticated: true, username: developerSessionCookie.value },
        { status: 200 }
      );
    }

    console.log("[DEVELOPER SESSION] User is not authenticated");
    return NextResponse.json(
      { authenticated: false },
      { status: 200 }
    );
  } catch (error) {
    console.error("[DEVELOPER SESSION] Error:", error);
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 }
    );
  }
}
