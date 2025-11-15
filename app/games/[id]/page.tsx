"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/app/components/Header";
import { useProtectedRoute } from "@/lib/use-protected-route";
import { checkGameFileExists, extractGameIdFromUrl } from "@/lib/game-utils";
import { getAllReportTopics, isValidReportTopic, ReportTopic } from "@/lib/data/reportTopics";
import "../../game-detail.css";

type NotificationState = {
  message: string;
  type: "info" | "success" | "error";
};

interface GameDetailState {
  id: number;
  title: string;
  description: string | null;
  developer: string | null;
  releaseDate: string | null;
  bannerUrl: string;
  playUrl: string | null;
  totalPlayers: number | null;
  averagePlayTime: number | null;
}

interface GameVersion {
  version: string;
  approvedDate: string;
  createdDate: string;
  description: string | null;
  linkToFilePath: string | null;
}

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

  return `/api/games/${numericId}/profile`;
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
  const reportTopics = useMemo(() => getAllReportTopics(), []);
  const [reportTopic, setReportTopic] = useState<ReportTopic["id"] | "">("");
  const [reportDetail, setReportDetail] = useState("");
  const [game, setGame] = useState<GameDetailState | null>(null);
  const [gameVersions, setGameVersions] = useState<GameVersion[]>([]);
  const [gameTags, setGameTags] = useState<string[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [adSlotCount, setAdSlotCount] = useState(3);
  const [versionsHeight, setVersionsHeight] = useState<number | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [versionsLoading, setVersionsLoading] = useState(true);
  const [tagsLoading, setTagsLoading] = useState(true);
  const playSessionRef = useRef({ gameId: 0, start: 0, reported: true });
  const finalizePlaySessionRef = useRef<() => void>(() => undefined);

  const showNotification = useCallback((message: string, type: NotificationState["type"] = "info") => {
    if (notificationTimeout.current) {
      clearTimeout(notificationTimeout.current);
    }
    setNotification({ message, type });
    notificationTimeout.current = setTimeout(() => setNotification(null), 3000);
  }, []);

  const updateSidebarHeight = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (window.innerWidth <= 1024) {
      setVersionsHeight(null);
      return;
    }

    if (!bannerRef.current) {
      return;
    }

    const { height } = bannerRef.current.getBoundingClientRect();
    if (height > 0) {
      setVersionsHeight((previous) => {
        const next = Math.round(height);
        return previous === next ? previous : next;
      });
    }
  }, []);

  const fetchGameVersions = useCallback(async (gameId: number) => {
    try {
      setVersionsLoading(true);
      const response = await fetch(`/api/games/${gameId}/versions`);
      if (response.ok) {
        const data = await response.json();
        setGameVersions(data.versions || []);
      }
    } catch (error) {
      console.error('Failed to fetch game versions:', error);
    } finally {
      setVersionsLoading(false);
    }
  }, []);

  const fetchGameTags = useCallback(async (gameId: number) => {
    try {
      setTagsLoading(true);
      const response = await fetch(`/api/games/${gameId}/tags`);
      if (response.ok) {
        const data = await response.json();
        setGameTags(data.tags || []);
      }
    } catch (error) {
      console.error('Failed to fetch game tags:', error);
    } finally {
      setTagsLoading(false);
    }
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
    updateSidebarHeight();
    window.addEventListener("resize", updateSidebarHeight);
    return () => {
      window.removeEventListener("resize", updateSidebarHeight);
    };
  }, [updateSidebarHeight]);

  useEffect(() => {
    const updateAdSlots = () => {
      const MIN_SLOTS = 3;
      const MAX_SLOTS = 8;
      const sidebarPadding = 160; // approximate vertical padding and spacing in the sidebar
      const cardMinHeight = 140; // keep in sync with CSS minimum height for ad cards
      const gap = 16; // matches 1rem gap between cards
      const availableHeight = Math.max(window.innerHeight - sidebarPadding, cardMinHeight);
      const estimatedCount = Math.floor((availableHeight + gap) / (cardMinHeight + gap));
      const nextCount = Math.min(MAX_SLOTS, Math.max(MIN_SLOTS, estimatedCount));
      setAdSlotCount(nextCount);
    };

    updateAdSlots();
    window.addEventListener("resize", updateAdSlots);
    return () => {
      window.removeEventListener("resize", updateAdSlots);
    };
  }, []);

  useEffect(() => {
    updateSidebarHeight();
  }, [updateSidebarHeight, game?.bannerUrl, isFetching, isFullscreen]);

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

        if (response.status === 404) {
          playSessionRef.current.gameId = 0;
          playSessionRef.current.start = 0;
          playSessionRef.current.reported = true;
          const fallbackParams = new URLSearchParams();
          if (decodedGameId) {
            fallbackParams.set("gameId", String(decodedGameId));
          }
          const fallbackUrl = `/game-fallback${fallbackParams.toString() ? `?${fallbackParams.toString()}` : ""}`;
          router.replace(fallbackUrl);
          return;
        }

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
          bannerUrl,
          playUrl,
          totalPlayers: typeof raw?.total_players === "number" ? raw.total_players : null,
          averagePlayTime: typeof raw?.average_play_time === "number" ? raw.average_play_time : null,
        };

        if (!normalized.playUrl) {
          playSessionRef.current.gameId = 0;
          playSessionRef.current.start = 0;
          playSessionRef.current.reported = true;
          const fallbackParams = new URLSearchParams();
          const fallbackGameId = normalized.id || decodedGameId;
          if (fallbackGameId) {
            fallbackParams.set("gameId", String(fallbackGameId));
          }
          if (normalized.title) {
            fallbackParams.set("gameName", normalized.title);
          }
          const fallbackUrl = `/game-fallback${fallbackParams.toString() ? `?${fallbackParams.toString()}` : ""}`;
          router.replace(fallbackUrl);
          return;
        }

        setGame(normalized);
        
        // Fetch game versions and tags after setting the game
        if (normalized.id > 0) {
          fetchGameVersions(normalized.id);
          fetchGameTags(normalized.id);
        }
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
  }, [decodedGameId, showNotification, fetchGameVersions, fetchGameTags, router]);

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
  const adSlots = useMemo(() => Array.from({ length: adSlotCount }, (_, index) => index + 1), [adSlotCount]);

  const totalPlayersDisplay = useMemo(() => {
    const count = game?.totalPlayers ?? 0;
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    } else {
      return count.toString();
    }
  }, [game?.totalPlayers]);
  
  const avgPlayTimeDisplay = useMemo(() => {
    const seconds = game?.averagePlayTime ?? 0;
    if (seconds <= 0) return "No Data";
    const totalMinutes = Math.floor(seconds / 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }, [game?.averagePlayTime]);

  const tagsDisplay = useMemo(() => {
    if (tagsLoading) return "Loading...";
    if (gameTags.length === 0) return "No tags";
    return gameTags.join(", ");
  }, [gameTags, tagsLoading]);

  const handleBannerLoad = useCallback(() => {
    updateSidebarHeight();
  }, [updateSidebarHeight]);

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

    if (!reportTopic || !isValidReportTopic(reportTopic)) {
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
      setReportTopic("");
      setReportDetail("");
    } catch (error: any) {
      console.error("Report submit error:", error);
      showNotification(error?.message || "Failed to submit report", "error");
    } finally {
      setIsSubmittingReport(false);
    }
  }, [game, reportDetail, reportTopic, showNotification]);

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
              onChange={(event) => {
                const value = event.target.value;
                setReportTopic(value ? (value as ReportTopic['id']) : "");
              }}
            >
              <option value="">Select an issue</option>
              {reportTopics.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.label}
                </option>
              ))}
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

  const handlePlay = useCallback(async () => {
    if (!game?.playUrl) {
      showNotification("Playable build coming soon", "info");
      return;
    }

    const destination = game.playUrl;

    const finalizeSession = () => {
      finalizePlaySessionRef.current?.();
    };

    const redirectToFallback = () => {
      playSessionRef.current.gameId = 0;
      playSessionRef.current.start = 0;
      playSessionRef.current.reported = true;

      const params = new URLSearchParams();
      const derivedId = extractGameIdFromUrl(destination) || game.id.toString();
      if (derivedId) {
        params.set("gameId", derivedId);
      }
      if (game.title) {
        params.set("gameName", game.title);
      }
      router.push(`/game-fallback${params.toString() ? `?${params.toString()}` : ""}`);
    };

    if (/^[a-zA-Z]+:\/\//.test(destination)) {
      finalizeSession();
      window.open(destination, "_blank", "noopener,noreferrer");
      showNotification(`Launching ${game.title}`, "success");
      return;
    }

    const fileExists = await checkGameFileExists(destination);

    if (fileExists) {
      finalizeSession();
      router.push(destination);
      showNotification(`Launching ${game.title}`, "success");
    } else {
      redirectToFallback();
      showNotification("Game file not found, showing fallback experience", "info");
    }
  }, [game, router, showNotification, checkGameFileExists]);

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
              onChange={(event) => {
                const value = event.target.value;
                setReportTopic(value ? (value as ReportTopic['id']) : "");
              }}
            >
              <option value="">Select an issue</option>
              {reportTopics.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.label}
                </option>
              ))}
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
  }, [closeReport, isReportOpen, isSubmittingReport, reportDetail, reportTopic, reportTopics, submitReport]);

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
                        onLoad={handleBannerLoad}
                        onError={(event) => {
                          const image = event.target as HTMLImageElement;
                          if (!image.src.includes("/images/placeholder.svg")) {
                            image.src = "/images/placeholder.svg";
                          } else {
                            handleBannerLoad();
                          }
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
                      <span className="stat-label">Total Players</span>
                      <span className="stat-value">{totalPlayersDisplay}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Average Play Time</span>
                      <span className="stat-value">{avgPlayTimeDisplay}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Release Date</span>
                      <span className="stat-value">{releaseDateDisplay}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Tags</span>
                      <span className="stat-value">{tagsDisplay}</span>
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

          <div className="game-detail-side">
            <aside
              className="versions-sidebar"
              style={versionsHeight ? { height: versionsHeight, maxHeight: versionsHeight } : undefined}
            >
              <div className="versions-section">
                <h3>Game Versions</h3>
                {versionsLoading ? (
                  <div className="versions-loading">Loading versions...</div>
                ) : gameVersions.length > 0 ? (
                  <div className="versions-list">
                    {gameVersions.map((version, index) => (
                      <div key={index} className="version-item">
                        <div className="version-header">
                          <span className="version-number">v{version.version}</span>
                          <span className="version-date">
                            {new Date(version.approvedDate).toLocaleDateString()}
                          </span>
                        </div>
                        {version.description && (
                          <p className="version-description">{version.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-versions">No versions available</div>
                )}
              </div>
            </aside>

            <section className="ads-sidebar">
              <h3>Advertisements</h3>
              <div className="ads-sidebar-grid">
                {adSlots.map((slotNumber) => (
                  <div key={slotNumber} className="ads-sidebar-card">
                    Ad Space {slotNumber}
                  </div>
                ))}
              </div>
            </section>
          </div>
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
            zIndex: 400,
          }}
        >
          {notification.message}
        </div>
      )}
      {reportModal}
    </>
  );
}
