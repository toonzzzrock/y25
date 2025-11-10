"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useProtectedRoute } from "@/lib/use-protected-route";
import { listItems, createItem } from "@/lib/data/items";

export default function ItemsIndexPage() {
  const { isLoading } = useProtectedRoute();
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    if (!isLoading) {
      setItems(listItems());
    }
  }, [isLoading]);

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#f5f5f5',
        color: '#333',
        fontSize: '1.2rem'
      }}>
        Loading...
      </div>
    );
  }

  async function createItemAction(formData: FormData) {
    const title = String(formData.get("title") || "").trim();
    const description = String(formData.get("description") || "").trim();
    if (!title) return;
    createItem({ title, description });
    setItems(listItems());
  }
  return (
    <div className="mx-auto max-w-3xl p-8 space-y-10">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">Items</h1>
        <Link
          href="/"
          className="text-sm text-zinc-600 hover:text-black dark:text-zinc-300 dark:hover:text-white"
        >
          Home
        </Link>
      </div>
      <form action={createItemAction} className="space-y-4 bg-zinc-50 dark:bg-zinc-900 p-6 rounded-lg">
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="title">
            Title
          </label>
          <input
            id="title"
            name="title"
            required
            className="w-full rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="description">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            className="w-full rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          className="rounded bg-black text-white dark:bg-white dark:text-black px-4 py-2 text-sm"
        >
          Create Item
        </button>
      </form>
      <ul className="space-y-4">
        {items.map((item) => (
          <li
            key={item.id}
            className="rounded border border-zinc-200 dark:border-zinc-800 p-4 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            <Link href={`/items/${item.id}`} className="block">
              <h2 className="font-medium mb-1">{item.title}</h2>
              {item.description && (
                <p className="text-sm text-zinc-600 dark:text-zinc-300 line-clamp-2">
                  {item.description}
                </p>
              )}
              <p className="mt-2 text-xs text-zinc-500">
                Updated {new Date(item.updatedAt).toLocaleString()}
              </p>
            </Link>
          </li>
        ))}
        {items.length === 0 && (
          <li className="text-sm text-zinc-500">No items yet. Create one above.</li>
        )}
      </ul>
    </div>
  );
}
