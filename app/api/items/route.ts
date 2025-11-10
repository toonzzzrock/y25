import { NextRequest, NextResponse } from "next/server";
import { createItem, listItems } from "@/lib/data/items";

export async function GET() {
  const items = listItems();
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body || typeof body.title !== "string" || body.title.trim() === "") {
      return NextResponse.json(
        { error: "'title' is required" },
        { status: 400 }
      );
    }
    const item = createItem({
      title: body.title,
      description: typeof body.description === "string" ? body.description : undefined,
    });
    return NextResponse.json(item, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
}
