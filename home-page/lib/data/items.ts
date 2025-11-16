export type Item = {
  id: string;
  title: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
};

// Simple in-memory store using a global singleton so it's shared across route modules
declare global {
  // eslint-disable-next-line no-var
  var __ITEMS_STORE__: Map<string, Item> | undefined;
  // eslint-disable-next-line no-var
  var __ITEMS_ID_COUNTER__: number | undefined;
}

const items: Map<string, Item> = globalThis.__ITEMS_STORE__ ?? new Map();
globalThis.__ITEMS_STORE__ = items;

// Seed a couple items for demo
function seed() {
  if (items.size > 0) return;
  const now = Date.now();
  const a: Item = {
    id: "1",
    title: "First item",
    description: "This is the first demo item",
    createdAt: now,
    updatedAt: now,
  };
  const b: Item = {
    id: "2",
    title: "Second item",
    description: "Another seeded item",
    createdAt: now,
    updatedAt: now,
  };
  items.set(a.id, a);
  items.set(b.id, b);
}
seed();

export function listItems(): Item[] {
  return Array.from(items.values()).sort((l, r) => r.createdAt - l.createdAt);
}

export function getItem(id: string): Item | undefined {
  return items.get(id);
}

let idCounter = globalThis.__ITEMS_ID_COUNTER__ ?? 3;
export function createItem(input: { title: string; description?: string }): Item {
  const now = Date.now();
  const id = String(idCounter++);
  const item: Item = {
    id,
    title: input.title,
    description: input.description ?? "",
    createdAt: now,
    updatedAt: now,
  };
  items.set(id, item);
  globalThis.__ITEMS_ID_COUNTER__ = idCounter;
  return item;
}

export function updateItem(
  id: string,
  input: { title?: string; description?: string }
): Item | undefined {
  const existing = items.get(id);
  if (!existing) return undefined;
  const updated: Item = {
    ...existing,
    title: input.title ?? existing.title,
    description: input.description ?? existing.description,
    updatedAt: Date.now(),
  };
  items.set(id, updated);
  return updated;
}

export function deleteItem(id: string): boolean {
  return items.delete(id);
}
