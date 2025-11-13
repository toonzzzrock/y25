"use client";

import { ManageCard } from "./ManageCard";

type ManageCardWrapperProps = {
  title: string;
  searchPlaceholder: string;
  emptyMessage: string;
  items: Array<{
    id: string;
    primary: string;
    secondary?: string;
    tertiary?: string;
  }>;
  apiBase: string;
};

export function ManageCardWrapper({
  title,
  searchPlaceholder,
  emptyMessage,
  items,
  apiBase,
}: ManageCardWrapperProps) {
  return (
    <ManageCard
      title={title}
      searchPlaceholder={searchPlaceholder}
      emptyMessage={emptyMessage}
      items={items}
      onBan={async (itemId) => {
        const response = await fetch(`${apiBase}/${itemId}/ban`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        const payload = await response.json();
        if (!response.ok || !payload?.success) {
          throw new Error(payload?.error ?? "Failed to ban item");
        }
      }}
    />
  );
}
