"use client";

import { useEffect, useState } from "react";
import styles from "../admin.module.css";

type PendingGame = {
  id: number;
  name: string;
  publisher: string;
  status: string;
  releaseDate: string | null;
  formattedDate: string;
};

type PendingGamesListProps = {
  games: PendingGame[];
};

export function PendingGamesList({ games }: PendingGamesListProps) {
  const [localGames, setLocalGames] = useState(games);
  const [busyIds, setBusyIds] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLocalGames(games);
  }, [games]);

  async function updateStatus(gameId: number, status: "Approved" | "Rejected") {
    setError(null);
    setBusyIds((prev) => {
      const next = new Set(prev);
      next.add(gameId);
      return next;
    });

    try {
      const response = await fetch(`/api/games/${gameId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      const payload = await response.json();
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error ?? "Failed to update game status");
      }

      setLocalGames((prev) => prev.filter((game) => game.id !== gameId));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update game status";
      setError(message);
    } finally {
      setBusyIds((prev) => {
        const next = new Set(prev);
        next.delete(gameId);
        return next;
      });
    }
  }

  if (localGames.length === 0) {
    return (
      <>
        <p className={styles.pendingEmpty}>There are no games awaiting review.</p>
        {error ? <p className={styles.errorText}>{error}</p> : null}
      </>
    );
  }

  return (
    <>
      <div className={styles.pendingRow}>
        {localGames.map((game) => {
          const disabled = busyIds.has(game.id);
          const submittedBy = game.publisher ? `Submitted by ${game.publisher}` : "Submitted by Unknown";

          return (
            <div key={game.id} className={styles.pendingCard}>
              <h4 className={styles.pendingTitle}>{game.name}</h4>
              <div className={styles.pendingThumb} />
              <span className={styles.pendingPublisher}>{submittedBy}</span>
              <span className={styles.pendingDate}>
                Submitted {game.formattedDate}
              </span>
              <div className={styles.pendingActions}>
                <button
                  type="button"
                  className={styles.approve}
                  disabled={disabled}
                  onClick={() => updateStatus(game.id, "Approved")}
                >
                  {disabled ? "Updating..." : "Approve"}
                </button>
                <button
                  type="button"
                  className={styles.reject}
                  disabled={disabled}
                  onClick={() => updateStatus(game.id, "Rejected")}
                >
                  {disabled ? "Updating..." : "Reject"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
      {error ? <p className={styles.errorText}>{error}</p> : null}
    </>
  );
}
