import { NextRequest, NextResponse } from "next/server";
import { deleteItem, getItem, updateItem } from "@/lib/data/items";

type Context = { params: Promise<{ id: string }> } | { params: { id: string } };

async function extractId(context: Context): Promise<string> {
  const params = (context as any).params;
  if (params && typeof (params as Promise<any>).then === "function") {
    const awaited = await (params as Promise<{ id: string }>);
    return awaited.id;
  }
  return (params as { id: string }).id;
}

export async function GET(_req: NextRequest, context: Context) {
  const id = await extractId(context);
  const item = getItem(id);
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(item);
}

export async function PUT(req: NextRequest, context: Context) {
  try {
    const id = await extractId(context);
    const body = await req.json();
    const updated = updateItem(id, {
      title: typeof body.title === "string" ? body.title : undefined,
      description:
        typeof body.description === "string" ? body.description : undefined,
    });
    if (!updated)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, context: Context) {
  const id = await extractId(context);
  const ok = deleteItem(id);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return new NextResponse(null, { status: 204 });
}
