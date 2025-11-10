import { getItem } from "@/lib/data/items";
import Link from "next/link";
import { notFound } from "next/navigation";
import React from "react";

export const dynamic = "force-dynamic";

export default async function ItemPage({ params }: { params: Promise<{ id: string }> }) {
  // Next.js 16 passes params as a Promise; unwrap it before use.
  const { id } = await params;
  const item = getItem(id);
  if (!item) return notFound();
  return (
    <div className="mx-auto max-w-2xl p-8 space-y-6">
      <h1 className="text-2xl font-semibold">{item.title}</h1>
      {item.description && (
        <p className="text-zinc-600 dark:text-zinc-300 whitespace-pre-wrap">
          {item.description}
        </p>
      )}
      <div className="text-sm text-zinc-500 flex gap-4">
        <span>
          Created: {new Date(item.createdAt).toLocaleString()}
        </span>
        <span>
          Updated: {new Date(item.updatedAt).toLocaleString()}
        </span>
      </div>
      <Link
        href="/items"
        className="inline-block rounded bg-black text-white dark:bg-white dark:text-black px-4 py-2 text-sm"
      >
        ← Back to items
      </Link>
    </div>
  );
}
