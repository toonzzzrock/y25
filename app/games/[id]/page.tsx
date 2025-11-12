"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/app/components/Header";
import { useProtectedRoute } from "@/lib/use-protected-route";
import "../../game-detail.css";

type NotificationState = {
  message: string;
  type: "info" | "success" | "error";
};

type GameDetailState = {
  id: number;
  title: string;
  description: string | null;
  developer: string | null;
  releaseDate: string | null;
  genre: string | null;
  bannerUrl: string;
  playUrl: string | null;
  rating: number | null;
  downloads: string | null;
};

const DEFAULT_SCREENSHOTS = [
  "/images/boxing-game.svg",
];

const resolveGameImage = (rawId: number | string | null | undefined) => {
  if (rawId === null || rawId === undefined) {
    return "/images/placeholder.svg";
  }

  const numericId = typeof rawId === "number" ? rawId : Number(rawId);
  if (!Number.isFinite(numericId)) {
    return "/images/placeholder.svg";
  }

  return `/data/game/${numericId}/game_profile.svg`;
};

const normalizeTitle = (title?: string | null) => {
  const base = title && title.trim().length > 0 ? title.trim() : "Untitled Game";
  return base.toUpperCase();
};

const formatReleaseDate = (value: string | null) => {
  if (!value) {
    return "Unknown";
  }
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return value;
  }
};

const buildScreenshotSet = (primary: string | null) => {
  const fallbackPrimary = primary && primary.length > 0 ? primary : DEFAULT_SCREENSHOTS[0];
  const pool = DEFAULT_SCREENSHOTS.filter((shot) => shot !== fallbackPrimary);
  return [fallbackPrimary, ...pool].slice(0, 6);
};

const renderStars = (rating: number) => {
  return (
    <div className="stat-rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className="star">
          {star <= Math.floor(rating) ? "★" : star - rating < 1 ? "⭐" : "☆"}
        </span>
      ))}
    </div>
  );
};

export default function GameDetailPage() {
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

  const notificationTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bannerRef = useRef<HTMLDivElement | null>(null);
  const [notification, setNotification] = useState<NotificationState | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportTopic, setReportTopic] = useState<"Lag" | "Disconnect" | "Bug" | "">("");
  const [reportDetail, setReportDetail] = useState("");
  const [game, setGame] = useState<GameDetailState | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const playSessionRef = useRef({ gameId: 0, start: 0, reported: true });
  const finalizePlaySessionRef = useRef<() => void>(() => undefined);

  const showNotification = useCallback((message: string, type: NotificationState["type"] = "info") => {
    if (notificationTimeout.current) {
      clearTimeout(notificationTimeout.current);
    }
    setNotification({ message, type });
    notificationTimeout.current = setTimeout(() => setNotification(null), 3000);
  }, []);

  useEffect(() => {
    return () => {
      if (notificationTimeout.current) {
        clearTimeout(notificationTimeout.current);
      }
      if (document.fullscreenElement && document.fullscreenElement === bannerRef.current) {
        const exit =
          document.exitFullscreen?.bind(document) ||
          (document as any).webkitExitFullscreen?.bind(document) ||
          (document as any).msExitFullscreen?.bind(document);
        exit?.();
      }
    };
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    if (!decodedGameId) {
      setIsFetching(false);
      setLoadError("Game not specified");
      setGame(null);
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
          showNotification(message, "error");
          return;
        }

  const raw = data.game;
        const parsedId = Number(raw?.id ?? decodedGameId);
        const safeId = Number.isFinite(parsedId) && parsedId > 0 ? parsedId : 0;
        const bannerUrl = resolveGameImage(safeId || decodedGameId);
        const rawPlayUrl = typeof raw?.playUrl === "string" ? raw.playUrl.trim() : "";

        let playUrl: string | null = null;
        if (rawPlayUrl.length > 0) {
          if (/^[a-zA-Z]+:\/\//.test(rawPlayUrl)) {
            playUrl = rawPlayUrl;
          } else if (rawPlayUrl.startsWith("/")) {
            playUrl = rawPlayUrl;
          } else {
            const sanitizedFile = rawPlayUrl.replace(/^\.\/+/, "").replace(/^\/+/, "");
            const versionFolder =
              typeof raw?.gameVersion === "string" && raw.gameVersion.trim().length > 0
                ? raw.gameVersion.trim().replace(/^\/+|\/+$/g, "")
                : "0";
            const baseId = safeId || decodedGameId;
            playUrl = sanitizedFile.startsWith("game_version/")
              ? `/data/game/${baseId}/${sanitizedFile}`
              : `/data/game/${baseId}/game_version/${versionFolder}/${sanitizedFile}`;
          }
        }

        const normalized: GameDetailState = {
          id: safeId,
          title: raw?.title ?? (safeId ? `Game ${safeId}` : "Untitled Game"),
          description: raw?.description ?? null,
          developer: raw?.developer ?? null,
          releaseDate: raw?.releaseDate ?? null,
          genre: raw?.genre ?? null,
          bannerUrl,
          playUrl,
          rating: typeof raw?.rating === "number" ? raw.rating : null,
          downloads: typeof raw?.downloads === "string" ? raw.downloads : null,
        };

        setGame(normalized);
      } catch (error: any) {
        if (error?.name === "AbortError") {
          return;
        }
        console.error("Game load error:", error);
        setGame(null);
        setLoadError("Failed to load game");
        showNotification("Failed to load game", "error");
      } finally {
        setIsFetching(false);
      }
    };

    loadGame();

    return () => {
      controller.abort();
    };
  }, [decodedGameId, showNotification]);

  const sendPlayDuration = useCallback((elapsedMs: number) => {
    const activeSession = playSessionRef.current;
    if (!activeSession.gameId || elapsedMs <= 0) {
      return;
    }

    const payload = {
      gameId: activeSession.gameId,
      durationMs: Math.round(elapsedMs),
    };

    try {
      if (navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
        navigator.sendBeacon("/api/play", blob);
      } else {
        fetch("/api/play", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
          keepalive: true,
        }).catch((error) => {
          console.warn("Failed to report play duration via fetch:", error);
        });
      }
    } catch (error) {
      console.warn("Failed to report play duration:", error);
    }
  }, []);

  useEffect(() => {
    if (!game?.id) {
      return;
    }

    const session = playSessionRef.current;
    session.gameId = game.id;
    session.start = Date.now();
    session.reported = false;

    const finalize = () => {
      if (session.reported || !session.start) {
        return;
      }

      const elapsed = Date.now() - session.start;
      session.reported = true;

      if (elapsed > 250) {
        sendPlayDuration(elapsed);
      }
    };

    finalizePlaySessionRef.current = finalize;

    window.addEventListener("pagehide", finalize);
    window.addEventListener("beforeunload", finalize);

    return () => {
      window.removeEventListener("pagehide", finalize);
      window.removeEventListener("beforeunload", finalize);
      finalize();
      finalizePlaySessionRef.current = () => undefined;
    };
  }, [game?.id, sendPlayDuration]);

  const releaseDateDisplay = useMemo(() => formatReleaseDate(game?.releaseDate ?? null), [game?.releaseDate]);
  const uppercaseTitle = useMemo(() => normalizeTitle(game?.title ?? null), [game?.title]);
  const developerDisplay = useMemo(() => {
    if (game?.developer && game.developer.trim().length > 0) {
      return `by ${game.developer}`;
    }
    return "by Unknown Publisher";
  }, [game?.developer]);

  const screenshotSources = useMemo(() => buildScreenshotSet(game?.bannerUrl ?? null), [game?.bannerUrl]);
  const ratingValue = useMemo(() => (game?.rating && game.rating > 0 ? game.rating : 4.5), [game?.rating]);
  const ratingDisplay = useMemo(() => ratingValue.toFixed(1), [ratingValue]);
  const downloadsDisplay = useMemo(() => game?.downloads ?? "Coming Soon", [game?.downloads]);
  const genreDisplay = useMemo(() => game?.genre ?? "Unspecified", [game?.genre]);

  const handleSearch = useCallback(() => {
    showNotification("Search functionality coming soon", "info");
  }, [showNotification]);

  const handleReport = useCallback(() => {
    setReportTopic("");
    setReportDetail("");
    setIsReportOpen(true);
  }, []);

  const closeReport = useCallback(() => {
    setIsReportOpen(false);
    setReportTopic("");
    setReportDetail("");
  }, []);

  const submitReport = useCallback(async () => {
    if (!game) {
      showNotification("Game data missing", "error");
      return;
    }

    if (!reportTopic) {
      showNotification("Please choose a report topic", "info");
      return;
    }

    if (!reportDetail || reportDetail.trim().length < 5) {
      showNotification("Report detail must be at least 5 characters", "info");
      return;
    }

    setIsSubmittingReport(true);
    try {
      const response = await fetch("/api/games/report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          gameId: game.id,
          topic: reportTopic,
          detail: reportDetail.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Failed to submit report");
      }

      showNotification("Report submitted successfully", "success");
      closeReport();
    } catch (error: any) {
      console.error("Report submit error:", error);
      showNotification(error?.message || "Failed to submit report", "error");
    } finally {
      setIsSubmittingReport(false);
    }
  }, [closeReport, game, reportDetail, reportTopic, showNotification]);

  const handleFullscreen = useCallback(async () => {
  const renderReportModal = () => {
    if (!isReportOpen) {
      return null;
    }

    return (
      <div
        className="report-overlay"
        role="dialog"
        aria-modal="true"
        onClick={closeReport}
      >
        <div
          className="report-modal"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="report-header">
            <h2>Report Game</h2>
            <button type="button" className="report-close" onClick={closeReport} aria-label="Close report form">
              ×
            </button>
          </div>
          <div className="report-body">
            <label className="report-label" htmlFor="report-topic">
              Issue type
            </label>
            <select
              id="report-topic"
              className="report-select"
              value={reportTopic}
              onChange={(event) => setReportTopic(event.target.value as "Lag" | "Disconnect" | "Bug" | "")}
            >
              <option value="">Select an issue</option>
              <option value="Lag">Lag</option>
              <option value="Disconnect">Disconnect</option>
              <option value="Bug">Bug</option>
            </select>

            <label className="report-label" htmlFor="report-detail">
              Details
            </label>
            <textarea
              id="report-detail"
              className="report-textarea"
              placeholder="Describe the problem you encountered"
              value={reportDetail}
              onChange={(event) => setReportDetail(event.target.value)}
              rows={5}
            />
          </div>
          <div className="report-footer">
            <button type="button" className="report-secondary" onClick={closeReport}>
              Cancel
            </button>
            <button
              type="button"
              className="report-primary"
              onClick={submitReport}
              disabled={isSubmittingReport}
            >
              {isSubmittingReport ? "Submitting..." : "Submit Report"}
            </button>
          </div>
        </div>
      </div>
    );
  };

    const element = bannerRef.current;

    if (!element) {
      showNotification("Fullscreen unavailable", "error");
      return;
    }

    try {
      if (!document.fullscreenElement) {
        const request =
          element.requestFullscreen?.bind(element) ||
          (element as any).webkitRequestFullscreen?.bind(element) ||
          (element as any).msRequestFullscreen?.bind(element);

        if (request) {
          await request();
          showNotification("Entering fullscreen", "info");
        } else {
          showNotification("Fullscreen not supported", "error");
        }
      } else {
        const exit =
          document.exitFullscreen?.bind(document) ||
          (document as any).webkitExitFullscreen?.bind(document) ||
          (document as any).msExitFullscreen?.bind(document);

        if (exit) {
          await exit();
          showNotification("Exiting fullscreen", "info");
        } else {
          showNotification("Unable to exit fullscreen", "error");
        }
      }
    } catch (error) {
      console.error("Fullscreen toggle error:", error);
      showNotification("Unable to toggle fullscreen", "error");
    }
  }, [showNotification]);

  const handlePlay = useCallback(() => {
    finalizePlaySessionRef.current?.();

    if (game?.playUrl) {
      const destination = game.playUrl;

      if (/^[a-zA-Z]+:\/\//.test(destination)) {
        window.open(destination, "_blank", "noopener,noreferrer");
      } else {
        router.push(destination);
      }

      showNotification(`Launching ${game.title}`, "success");
    } else {
      showNotification("Playable build coming soon", "info");
    }
  }, [game, router, showNotification]);

  const handleScreenshotClick = useCallback(
    (index: number) => {
      showNotification(`Screenshot ${index + 1}`, "info");
    },
    [showNotification]
  );

  const reportModal = useMemo(() => {
    if (!isReportOpen) {
      return null;
    }

    return (
      <div className="report-overlay" role="dialog" aria-modal="true">
        <div className="report-modal">
          <div className="report-header">
            <h2>Report Game</h2>
            <button type="button" className="report-close" onClick={closeReport} aria-label="Close report form">
              ×
            </button>
          </div>
          <div className="report-body">
            <label className="report-label" htmlFor="report-topic">
              Issue type
            </label>
            <select
              id="report-topic"
              className="report-select"
              value={reportTopic}
              onChange={(event) => setReportTopic(event.target.value as "Lag" | "Disconnect" | "Bug" | "")}
            >
              <option value="">Select an issue</option>
              <option value="Lag">Lag</option>
              <option value="Disconnect">Disconnect</option>
              <option value="Bug">Bug</option>
            </select>

            <label className="report-label" htmlFor="report-detail">
              Details
            </label>
            <textarea
              id="report-detail"
              className="report-textarea"
              placeholder="Describe the problem you encountered"
              value={reportDetail}
              onChange={(event) => setReportDetail(event.target.value)}
              rows={5}
            />
          </div>
          <div className="report-footer">
            <button type="button" className="report-secondary" onClick={closeReport}>
              Cancel
            </button>
            <button
              type="button"
              className="report-primary"
              onClick={submitReport}
              disabled={isSubmittingReport}
            >
              {isSubmittingReport ? "Submitting..." : "Submit Report"}
            </button>
          </div>
        </div>
      </div>
    );
  }, [closeReport, isReportOpen, isSubmittingReport, reportDetail, reportTopic, submitReport]);

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          color: "#fff",
          fontSize: "1.1rem",
        }}
      >
        Loading...
      </div>
    );
  }

  return (
    <>
      <Header showSearch={true} onSearch={handleSearch} />
      <main className="game-detail-main">
        <div className="game-detail-wrapper">
          <div className="game-detail-content">
            {isFetching ? (
              <div style={{ color: "#f1e2dc", marginTop: "2rem" }}>Loading game details…</div>
            ) : loadError ? (
              <div style={{ color: "#ffb88b", marginTop: "2rem" }}>
                <p style={{ marginBottom: "1rem" }}>{loadError}</p>
                <button
                  type="button"
                  onClick={() => router.push("/home")}
                  style={{
                    padding: "0.75rem 1.5rem",
                    borderRadius: "6px",
                    border: "none",
                    background: "#ff7a2b",
                    color: "#fff",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Back to home
                </button>
              </div>
            ) : game ? (
              <>
                <section className="game-hero">
                  <div className="hero-container">
                    <div
                      className={`game-banner-container${isFullscreen ? " fullscreen-active" : ""}`}
                      ref={bannerRef}
                    >
                      <img
                        src={game.bannerUrl}
                        alt={game.title}
                        className="game-banner-image"
                        onError={(event) => {
                          (event.target as HTMLImageElement).src = "/images/placeholder.svg";
                        }}
                      />
                    </div>

                    <div className="game-hero-info">
                      <div className="game-header-row">
                        <div>
                          <h1 className="game-title">{uppercaseTitle}</h1>
                          <p className="game-developer">{developerDisplay}</p>
                        </div>
                        <div className="game-actions">
                          <button type="button" className="report-btn" onClick={handleReport}>
                            Report
                          </button>
                          <button
                            type="button"
                            className="fullscreen-btn"
                            onClick={handleFullscreen}
                            title="Full Screen"
                            aria-pressed={isFullscreen}
                          >
                            <svg
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="game-info-section">
                  <div className="game-info-header">
                    <div className="game-info-left">
                      <h2 className="game-info-title">ABOUT THIS GAME</h2>
                    </div>
                  </div>

                  <div className="game-description">
                    <h3>Description</h3>
                    <p>{game.description ?? "No description has been provided for this title yet."}</p>
                  </div>

                  <div className="game-stats">
                    <div className="stat-item">
                      <span className="stat-label">Rating</span>
                      {renderStars(ratingValue)}
                      <span className="stat-value">{ratingDisplay}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Downloads</span>
                      <span className="stat-value">{downloadsDisplay}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Release Date</span>
                      <span className="stat-value">{releaseDateDisplay}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Genre</span>
                      <span className="stat-value">{genreDisplay}</span>
                    </div>
                  </div>

                  <button type="button" className="play-btn-large" onClick={handlePlay}>
                    Play Now
                  </button>
                </section>

                <section className="screenshots-section">
                  <h3>Screenshots</h3>
                  <div className="screenshots-grid">
                    {screenshotSources.map((src, index) => (
                      <div
                        key={`${src}-${index}`}
                        className="screenshot-item"
                        onClick={() => handleScreenshotClick(index)}
                      >
                        <img
                          src={src}
                          alt={`Screenshot ${index + 1}`}
                          onError={(event) => {
                            (event.target as HTMLImageElement).src = "/images/placeholder.svg";
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </section>
              </>
            ) : null}
          </div>

          <aside className="ad-sidebar">
            <div className="ad-space">
              <p>
                SPACE
                <br />
                FOR
                <br />
                ADVERTISING
              </p>
            </div>
          </aside>
        </div>
      </main>

      {notification && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            padding: "0.75rem 1.25rem",
            borderRadius: "8px",
            color: "#fff",
            backgroundColor:
              notification.type === "success"
                ? "#2f9e44"
                : notification.type === "error"
                ? "#d00000"
                : "#ff7a2b",
            boxShadow: "0 8px 20px rgba(0, 0, 0, 0.25)",
            fontWeight: 600,
            zIndex: 20,
          }}
        >
          {notification.message}
        </div>
      )}
      {reportModal}
    </>
  );
}
