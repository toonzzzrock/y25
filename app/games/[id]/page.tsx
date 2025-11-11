"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useProtectedRoute } from "@/lib/use-protected-route";
import Header from "@/app/components/Header";

interface GameDetail {
  id: number;
  title: string | null;
  description: string | null;
  developer: string | null;
  imageUrl: string | null;
  releaseDate: string | null;
}

export default function GameOverviewPage() {
  const { isLoading } = useProtectedRoute();
  const router = useRouter();
  const params = useParams();

  const rawParam = useMemo(() => {
    const value = (params as Record<string, string | string[] | undefined>)?.id;
    if (Array.isArray(value)) {
      return value[0] ?? "";
    }
    return value ?? "";
  }, [params]);

  const decodedGameId = useMemo(() => {
    if (!rawParam) {
      return "";
    }
    try {
      return decodeURIComponent(rawParam);
    } catch {
      return rawParam;
    }
  }, [rawParam]);

  const [game, setGame] = useState<GameDetail | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!decodedGameId) {
      setGame(null);
      setLoadError("Game not specified");
      setIsFetching(false);
      return;
    }

    const controller = new AbortController();

    const loadGame = async () => {
      try {
        setIsFetching(true);
        setLoadError(null);

        const response = await fetch(`/api/games/${encodeURIComponent(decodedGameId)}`, {
          signal: controller.signal,
        });
        const data = await response.json();

        if (!response.ok || !data?.game) {
          const message = data?.error || "Failed to load game";
          setGame(null);
          setLoadError(message);
          return;
        }

        const normalized: GameDetail = {
          id: typeof data.game.id === "number" ? data.game.id : Number(data.game.id),
          title: data.game.title ?? null,
          description: data.game.description ?? null,
          developer: data.game.developer ?? null,
          imageUrl: data.game.imageUrl ?? null,
          releaseDate: data.game.releaseDate ?? null,
        };

        setGame(normalized);
      } catch (error: any) {
        if (error?.name === "AbortError") {
          return;
        }
        console.error("Game load error:", error);
        setGame(null);
        setLoadError("Failed to load game");
      } finally {
        setIsFetching(false);
      }
    };

    loadGame();

    return () => {
      controller.abort();
    };
  }, [decodedGameId]);

  const releaseDateDisplay = useMemo(() => {
    if (!game?.releaseDate) {
      return "Unknown";
    }

    try {
      return new Date(game.releaseDate).toLocaleDateString();
    } catch {
      return game.releaseDate;
    }
  }, [game?.releaseDate]);

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          color: "#fff",
          fontSize: "1.2rem",
        }}
      >
        Loading...
      </div>
    );
  }

  return (
    <>
      <Header showSearch={false} />
      <main
        style={{
          maxWidth: "960px",
          margin: "32px auto",
          padding: "0 24px",
          color: "#fff",
        }}
      >
        <button
          type="button"
          onClick={() => router.back()}
          style={{
            background: "transparent",
            border: "none",
            color: "#ff7a2b",
            cursor: "pointer",
            fontWeight: 600,
            marginBottom: "18px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          ← Back
        </button>

        <section
          style={{
            background: "#1a0f0d",
            borderRadius: "8px",
            padding: "24px",
            boxShadow: "0 0 0 4px rgba(0, 0, 0, 0.25) inset",
            minHeight: "320px",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          {isFetching ? (
            <div style={{ color: "#c7b7b0" }}>Loading game details…</div>
          ) : loadError ? (
            <div style={{ color: "#ffb88b" }}>{loadError}</div>
          ) : game ? (
            <>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "18px" }}>
                <div
                  style={{
                    width: "180px",
                    height: "180px",
                    borderRadius: "8px",
                    overflow: "hidden",
                    background: "#120a09",
                    border: "1px solid rgba(255, 122, 43, 0.25)",
                    flexShrink: 0,
                  }}
                >
                  <img
                    src={game.imageUrl || "/images/placeholder.svg"}
                    alt={game.title || "Game cover"}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={(event) => {
                      (event.target as HTMLImageElement).src = "/images/placeholder.svg";
                    }}
                  />
                </div>

                <div style={{ flex: 1, minWidth: "240px" }}>
                  <h1 style={{ margin: 0, fontSize: "1.8rem" }}>{game.title || "Untitled game"}</h1>
                  {game.developer && (
                    <div style={{ marginTop: "6px", color: "#c7b7b0" }}>Published by {game.developer}</div>
                  )}
                  <div style={{ marginTop: "6px", color: "#c7b7b0" }}>Release date: {releaseDateDisplay}</div>
                </div>
              </div>

              <div>
                <h2 style={{ margin: "0 0 10px 0", fontSize: "1.1rem", color: "#ffb88b" }}>About this game</h2>
                <p style={{ margin: 0, lineHeight: 1.6, color: "#f1e2dc" }}>
                  {game.description || "No description has been provided for this title yet."}
                </p>
              </div>
            </>
          ) : (
            <div>Game not found.</div>
          )}
        </section>
      </main>
    </>
  );
}
