"use client";

import { useEffect, useMemo, useState } from "react";
import { formatStatus } from "../utils/formatters";
import styles from "../admin.module.css";

type GameItem = {
  id: number;
  name: string;
  status: string;
  totalPlayers: number;
};

type GamesGridProps = {
  games: GameItem[];
  emptyMessage: string;
};

function normalise(value: string): string {
  const base = String(value);
  const normalised = typeof base.normalize === "function" ? base.normalize("NFKD") : base;
  return normalised.toLocaleLowerCase();
}

const numberFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export function GamesGrid({ games, emptyMessage }: GamesGridProps) {
  const [localGames, setLocalGames] = useState(games);
  const [nameQuery, setNameQuery] = useState("");
  const [idQuery, setIdQuery] = useState("");
  const [busyIds, setBusyIds] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLocalGames(games);
  }, [games]);

  const normalisedNameQuery = normalise(nameQuery.trim());
  const normalisedIdQuery = idQuery.trim();

  const filteredGames = useMemo(() => {
    return localGames.filter(({ id, name, status }) => {
      const matchesName = normalisedNameQuery
        ? [name, status]
            .filter(Boolean)
            .some((value) => normalise(value).includes(normalisedNameQuery))
        : true;

      const matchesId = normalisedIdQuery
        ? String(id).includes(normalisedIdQuery)
        : true;

      return matchesName && matchesId;
    });
  }, [localGames, normalisedIdQuery, normalisedNameQuery]);

  async function handleStatusUpdate(gameId: number, nextStatus: string) {
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
        body: JSON.stringify({ status: nextStatus }),
      });

      const payload = await response.json();

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error ?? "Failed to update game status");
      }

      setLocalGames((prev) =>
        prev.map((game) =>
          game.id === gameId ? { ...game, status: nextStatus } : game
        )
      );
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

  return (
    <>
      <div className={styles.manageGamesRow}>
        <input
          className={styles.gameSearch}
          placeholder="Game name"
          aria-label="Search game names"
          value={nameQuery}
          onChange={(event) => setNameQuery(event.target.value)}
        />
        <input
          className={styles.gameSearch}
          placeholder="Game ID"
          aria-label="Search game IDs"
          value={idQuery}
          onChange={(event) => setIdQuery(event.target.value)}
          inputMode="numeric"
        />
      </div>
      <div className={styles.gamesGrid}>
        {filteredGames.length > 0 ? (
          filteredGames.map((game) => {
            const isBusy = busyIds.has(game.id);
            return (
              <div key={game.id} className={styles.thumb}>
                <div className={styles.thumbImg} />
                <span className={styles.thumbId}>ID: {game.id}</span>
                <span className={styles.thumbName}>{game.name}</span>
                <span className={styles.thumbMeta}>
                  {numberFormatter.format(game.totalPlayers)} players · {formatStatus(
                    game.status
                  )}
                </span>
                <div className={styles.thumbActions}>
                  <button
                    type="button"
                    className={`${styles.btnBan} ${styles.thumbButton}`}
                    disabled={isBusy}
                    onClick={() => handleStatusUpdate(game.id, "Reject")}
                  >
                    {isBusy ? "Updating..." : "Ban game"}
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <p className={styles.manageEmpty}>{emptyMessage}</p>
        )}
      </div>
      {error ? <p className={styles.errorText}>{error}</p> : null}
    </>
  );
}
