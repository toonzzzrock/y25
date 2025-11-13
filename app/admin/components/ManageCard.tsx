"use client";

import { useMemo, useState } from "react";
import styles from "../admin.module.css";

type ManageCardItem = {
  id: string;
  primary: string;
  secondary?: string;
  tertiary?: string;
};

type ManageCardProps = {
  title: string;
  searchPlaceholder: string;
  emptyMessage: string;
  items: ManageCardItem[];
  onBan?: (itemId: string) => Promise<void>;
};

function normalise(value: string): string {
  const base = String(value);
  const normalised = typeof base.normalize === "function" ? base.normalize("NFKD") : base;
  return normalised.toLocaleLowerCase();
}

export function ManageCard({
  title,
  searchPlaceholder,
  emptyMessage,
  items,
  onBan,
}: ManageCardProps) {
  const [query, setQuery] = useState("");
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const normalisedQuery = normalise(query.trim());

  const filteredItems = useMemo(() => {
    if (!normalisedQuery) {
      return items;
    }

    return items.filter(({ primary, secondary, tertiary }) =>
      [primary, secondary, tertiary]
        .filter(Boolean)
        .some((text) => text && normalise(text).includes(normalisedQuery))
    );
  }, [items, normalisedQuery]);

  async function handleBan(itemId: string) {
    if (!onBan) return;

    setError(null);
    setBusyIds((prev) => {
      const next = new Set(prev);
      next.add(itemId);
      return next;
    });

    try {
      await onBan(itemId);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to ban item";
      setError(message);
    } finally {
      setBusyIds((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  }

  return (
    <div className={styles.manageCard}>
      <h4 className={styles.manageTitle}>{title}</h4>
      <div className={styles.userSearch}>
        <input
          className={styles.searchInput}
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>
      <div className={styles.manageList}>
        {filteredItems.length > 0 ? (
          filteredItems.map((item) => (
            <div key={item.id} className={styles.manageItem}>
              <div className={styles.manageInfo}>
                <span className={styles.itemPrimary}>{item.primary}</span>
                {item.secondary ? (
                  <span className={styles.itemSecondary}>{item.secondary}</span>
                ) : null}
                {item.tertiary ? (
                  <span className={styles.itemSecondary}>{item.tertiary}</span>
                ) : null}
              </div>
              <div className={styles.manageActions}>
                <button
                  type="button"
                  className={styles.btnBan}
                  disabled={busyIds.has(item.id)}
                  onClick={() => handleBan(item.id)}
                >
                  {busyIds.has(item.id) ? "Banning..." : "Ban"}
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className={styles.manageEmpty}>{emptyMessage}</p>
        )}
      </div>
      {error ? <p className={styles.errorText}>{error}</p> : null}
    </div>
  );
}
