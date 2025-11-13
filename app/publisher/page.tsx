"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { useProtectedRoute } from "@/lib/use-protected-route";
import { useAuth } from "@/lib/auth-context";
import Header from "@/app/components/Header";
import UploadModal from "@/app/components/UploadModal";
import EditGameModal from "@/app/components/EditGameModal";
import "./publisher.css";

type NotificationVariant = "success" | "error" | "info";

type PublisherSummary = {
  username: string;
  accountName: string | null;
};

type GameStatus = 'Approve' | 'Reject' | 'Pending';
type UpdateStatus = 'Approve' | 'Reject' | 'Pending';

type Game = {
  id: number;
  title: string;
  description: string | null;
  bannerUrl: string | null;
  releaseDate: string | null;
  gameStatus: GameStatus;
  updateStatus: UpdateStatus | null;
  patchNumber: number | null;
  metrics: {
    total_players: number | null;
    average_playtime: number | null;
  };
};

type DashboardData = {
  publisher: PublisherSummary | null;
  games: Game[];
  totalGames: number;
};

type NotificationState = {
  message: string;
  type: NotificationVariant;
};

type ReportEntry = {
  id: number;
  gameId: number;
  gameTitle: string;
  reporter: string;
  topic: string;
  detail: string;
  reportedAt: string;
};



function PlayersIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5s-3 1.34-3 3 1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
    </svg>
  );
}

function PlaytimeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.2 3.2.8-1.3-4.5-2.7V7z" />
    </svg>
  );
}

function WaitingIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 11h5v2h-7V7h2v6z" />
    </svg>
  );
}

function ApprovedIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M9 16.17l-3.5-3.5L4.08 14.1 9 19l11-11-1.41-1.42z" />
    </svg>
  );
}

function RejectedIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.3 5.71L12 12l6.3 6.29-1.41 1.41L10.59 13.4 4.3 19.7 2.89 18.29 9.17 12 2.89 5.71 4.3 4.3l6.29 6.29 6.29-6.29z" />
    </svg>
  );
}

function formatCompactNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "—";
  }

  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1).replace(/\.0$/, "")}m`;
  }

  if (value >= 1000) {
    return `${(value / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  }

  return value.toString();
}

function formatRating(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "—";
  }

  return value.toFixed(1).replace(/\.0$/, "");
}

function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "—";
  }

  return `$${value.toLocaleString("en-US", {
    maximumFractionDigits: value >= 1000 ? 0 : 2,
  })}`;
}

function formatPlaytime(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined || Number.isNaN(minutes)) {
    return "—";
  }

  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}m`;
}

function formatUpdatedAt(value: string | null | undefined): string {
  if (!value) {
    return "Awaiting review";
  }

  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "Awaiting review";
    }
    return `Updated ${date.toLocaleDateString()}`;
  } catch (error) {
    return "Awaiting review";
  }
}



const resolvePublisherGameImage = (rawId: number | string | null | undefined) => {
  if (rawId === null || rawId === undefined) {
    return "/images/placeholder.svg";
  }

  const numericId = typeof rawId === "number" ? rawId : Number(rawId);
  if (!Number.isFinite(numericId)) {
    return "/images/placeholder.svg";
  }

  return `/api/games/${numericId}/profile`;
};

const normalizeGameBannerUrl = (game: any, fallbackId: number): string => {
  const candidates: Array<string | null | undefined> = [
    game?.bannerUrl,
    game?.banner_url,
    game?.banner,
    game?.coverUrl,
    game?.cover_url,
    game?.imageUrl,
    game?.image_url,
    game?.link_to_file,
    game?.thumbnail,
  ];

  for (const candidate of candidates) {
    if (typeof candidate !== "string") {
      continue;
    }

    const trimmed = candidate.trim();
    if (!trimmed || trimmed.includes("placeholder")) {
      continue;
    }

    // Skip common non-image files (HTML, JS, etc.)
    if (/\.(html|htm|js|css|json|txt)$/i.test(trimmed)) {
      continue;
    }

    if (/^(https?:)?\/\//.test(trimmed)) {
      return trimmed;
    }

    if (trimmed.startsWith("/")) {
      return trimmed;
    }

    return `/${trimmed.replace(/^\/+/u, "")}`;
  }

  return resolvePublisherGameImage(fallbackId);
};

const mapApiGameToPublished = (game: any, fallbackIndex: number = 0): Game => {
  const rawId = game?.id ?? game?.game_id ?? fallbackIndex + 1;
  const numericId = Number(rawId);
  const safeId = Number.isFinite(numericId) && numericId > 0 ? numericId : fallbackIndex + 1;
  const rawRelease = game?.release_date ?? game?.releaseDate ?? null;

  return {
    id: safeId,
    title: game?.title ?? game?.game_name ?? `Game ${safeId}`,
    description: game?.description ?? game?.detail ?? null,
    bannerUrl: normalizeGameBannerUrl(game, safeId),
    releaseDate: rawRelease,
    gameStatus: game?.gameStatus ?? game?.game_status ?? 'Pending',
    updateStatus: game?.updateStatus ?? game?.update_status ?? null,
    patchNumber: game?.patchNumber ?? game?.patch_number ?? null,
    metrics: {
      total_players:
        typeof game?.metrics?.total_players === "number"
          ? game.metrics.total_players
          : typeof game?.total_players === "number"
          ? game.total_players
          : null,
      average_playtime:
        typeof game?.metrics?.average_playtime === "number"
          ? game.metrics.average_playtime
          : typeof game?.average_playtime === "number"
          ? game.average_playtime
          : null,
    },
  };
};

const mergeGameLists = (current: Game[], incoming: Game[]): Game[] => {
  if (!Array.isArray(incoming) || incoming.length === 0) {
    return current;
  }

  const currentMap = new Map<number, Game>();
  current.forEach((game) => currentMap.set(game.id, game));

  const merged: Game[] = [];

  incoming.forEach((game) => {
    const existing = currentMap.get(game.id);
    if (existing) {
      merged.push({
        ...existing,
        ...game,
        metrics: {
          total_players: game.metrics.total_players ?? existing.metrics.total_players ?? null,
          average_playtime: game.metrics.average_playtime ?? existing.metrics.average_playtime ?? null,
        },
      });
      currentMap.delete(game.id);
    } else {
      merged.push(game);
    }
  });

  currentMap.forEach((remaining) => merged.push(remaining));

  return merged;
};

const dedupeGamesById = (games: Game[]): Game[] => {
  if (!Array.isArray(games) || games.length <= 1) {
    return games;
  }

  const seen = new Set<number>();
  const unique: Game[] = [];

  for (const game of games) {
    if (seen.has(game.id)) {
      continue;
    }
    seen.add(game.id);
    unique.push(game);
  }

  return unique;
};

export default function PublisherPage() {
  const { isLoading: isRouteLoading } = useProtectedRoute();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<NotificationState | null>(null);
  const [publisherGames, setPublisherGames] = useState<Game[]>([]);
  const [reports, setReports] = useState<ReportEntry[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const [reportsError, setReportsError] = useState<string | null>(null);
  const [selectedGameFilter, setSelectedGameFilter] = useState<string>("all");
  const [selectedUpdateFilter, setSelectedUpdateFilter] = useState<string>("all");
  const [selectedReportFilter, setSelectedReportFilter] = useState<string>("all");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [gameBeingEdited, setGameBeingEdited] = useState<Game | null>(null);
  const notificationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showNotification = useCallback((message: string, type: NotificationVariant = "info") => {
    setNotification({ message, type });
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }
    notificationTimeoutRef.current = setTimeout(() => {
      setNotification(null);
      notificationTimeoutRef.current = null;
    }, 3200);
  }, []);

  useEffect(() => {
    return () => {
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (user && user.role !== "publisher") {
      showNotification("Publisher access required. Redirecting...", "error");
      const timer = setTimeout(() => {
        router.replace("/home");
      }, 1500);

      return () => {
        clearTimeout(timer);
      };
    }

    return undefined;
  }, [authLoading, router, showNotification, user]);

  useEffect(() => {
    if (authLoading || !user || user.role !== "publisher") {
      return;
    }

    const controller = new AbortController();
    let isMounted = true;

    const loadDashboard = async () => {
      setIsFetching(true);
      setError(null);

      try {
        const response = await fetch("/api/publisher/dashboard", {
          signal: controller.signal,
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || "Failed to load publisher dashboard");
        }

        if (isMounted) {
          const mappedGames = Array.isArray(data?.games)
            ? (data.games as any[]).map((game, index) => mapApiGameToPublished(game, index))
            : [];
          const dedupedGames = dedupeGamesById(mappedGames);

          const normalized: DashboardData = {
            publisher: data?.publisher ?? null,
            games: dedupedGames,
            totalGames: typeof data?.totalGames === "number" ? data.totalGames : dedupedGames.length,
          };
          setDashboard(normalized);
          setPublisherGames(normalized.games);
        }
      } catch (fetchError: any) {
        if (fetchError?.name === "AbortError") {
          return;
        }
        console.error("Publisher dashboard fetch error:", fetchError);
        const message = fetchError?.message || "Failed to load publisher dashboard";
        if (isMounted) {
          setError(message);
          showNotification(message, "error");
        }
      } finally {
        if (isMounted) {
          setIsFetching(false);
        }
      }
    };

    loadDashboard();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [authLoading, showNotification, user]);

  useEffect(() => {
    if (authLoading || !user?.username) {
      return;
    }

    const controller = new AbortController();
    let isMounted = true;

    const loadPublisherGames = async () => {
      try {
        const response = await fetch(
          `/api/games?limit=100&publisher=${encodeURIComponent(user.username)}`,
          { signal: controller.signal }
        );
        const data = await response.json();

        if (!isMounted) {
          return;
        }

        if (!response.ok) {
          throw new Error(data?.error || "Failed to load published games");
        }

        const normalized = Array.isArray(data?.games)
          ? (data.games as any[]).map((game, index) => mapApiGameToPublished(game, index))
          : [];

        const uniqueIncoming = dedupeGamesById(normalized);

        setPublisherGames((previous) => mergeGameLists(previous, uniqueIncoming));
      } catch (fetchError: any) {
        if (fetchError?.name === "AbortError") {
          return;
        }
        console.error("Published games fetch error:", fetchError);
        showNotification(fetchError?.message || "Failed to load published games", "error");
      }
    };

    loadPublisherGames();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [authLoading, showNotification, user?.username]);

  useEffect(() => {
    if (authLoading || !user?.username) {
      return;
    }

    const controller = new AbortController();
    let isMounted = true;

    const loadReports = async () => {
      setIsLoadingReports(true);
      setReportsError(null);

      try {
        const params = new URLSearchParams({ limit: "100" });
        if (selectedReportFilter !== "all") {
          params.set("gameId", selectedReportFilter);
        }

        const response = await fetch(`/api/publisher/reports?${params.toString()}`, {
          signal: controller.signal,
        });
        const data = await response.json();

        if (!isMounted) {
          return;
        }

        if (!response.ok) {
          throw new Error(data?.error || "Failed to load reports");
        }

        const normalized: ReportEntry[] = Array.isArray(data?.reports)
          ? data.reports.map((item: any, index: number) => ({
              id: Number.isFinite(Number(item?.id)) ? Number(item.id) : index + 1,
              gameId: Number.isFinite(Number(item?.gameId ?? item?.game_id))
                ? Number(item?.gameId ?? item?.game_id)
                : 0,
              gameTitle: item?.gameTitle ?? item?.gameName ?? item?.game_name ?? `Game ${index + 1}`,
              reporter: item?.reporter ?? item?.username ?? "Unknown",
              topic: item?.topic ?? item?.report_topic ?? "General",
              detail: item?.detail ?? "",
              reportedAt: item?.reportedAt ?? item?.report_time ?? new Date().toISOString(),
            }))
          : [];

        setReports(normalized);
      } catch (fetchError: any) {
        if (fetchError?.name === "AbortError") {
          return;
        }
        console.error("Publisher reports fetch error:", fetchError);
        if (isMounted) {
          setReports([]);
          setReportsError(fetchError?.message || "Failed to load reports");
        }
      } finally {
        if (isMounted) {
          setIsLoadingReports(false);
        }
      }
    };

    loadReports();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [authLoading, selectedReportFilter, user?.username]);

  const handleUploadClick = useCallback(() => {
    setIsUploadModalOpen(true);
  }, []);

  const handleUploadSuccess = useCallback(() => {
    // Refresh dashboard after successful upload
    window.location.reload();
  }, []);

  const handleEditSuccess = useCallback(
    (updated: { id: number; title: string }) => {
      setPublisherGames((previous) =>
        previous.map((game) =>
          game.id === updated.id
            ? {
                ...game,
                title: updated.title,
              }
            : game
        )
      );

      setDashboard((previous) => {
        if (!previous) {
          return previous;
        }
        return {
          ...previous,
          games: previous.games.map((game: Game) =>
            game.id === updated.id
              ? {
                  ...game,
                  title: updated.title,
                }
              : game
          ),
        };
      });
    },
    []
  );

  const handleGameAction = useCallback(
    async (action: "edit" | "delete", gameId: number, title: string) => {
      if (action === "edit") {
        const targetGame = publisherGames.find((game) => game.id === gameId);
        if (!targetGame) {
          showNotification("Game not found", "error");
          return;
        }
        setGameBeingEdited(targetGame);
        setIsEditModalOpen(true);
        return;
      }

      if (action === "delete") {
        // Show confirmation dialog
        const confirmed = window.confirm(
          `Are you sure you want to delete "${title}"?\n\nThis action cannot be undone and will permanently remove the game and all related data.`
        );

        if (!confirmed) {
          return;
        }

        try {
          const response = await fetch('/api/games/delete', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ gameId }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Failed to delete game');
          }

          showNotification(data.message || `Game "${title}" deleted successfully`, "success");
          
          // Update the state to remove the deleted game
          setPublisherGames((prevGames) => prevGames.filter((game) => game.id !== gameId));
          setDashboard((prevDashboard) => {
            if (!prevDashboard) return null;
            return {
              ...prevDashboard,
              games: prevDashboard.games.filter((game: Game) => game.id !== gameId),
              totalGames: prevDashboard.totalGames - 1,
            };
          });
        } catch (error: any) {
          console.error('Delete game error:', error);
          showNotification(error.message || 'Failed to delete game', "error");
        }
      }
    },
    [publisherGames, showNotification]
  );

  const filteredGames = useMemo(() => {
    return publisherGames.filter((game) => {
      // Filter by game status
      if (selectedGameFilter !== "all" && game.gameStatus !== selectedGameFilter) {
        return false;
      }
      
      // Filter by update status
      if (selectedUpdateFilter !== "all") {
        if (selectedUpdateFilter === "none" && game.updateStatus !== null) {
          return false;
        }
        if (selectedUpdateFilter !== "none" && game.updateStatus !== selectedUpdateFilter) {
          return false;
        }
      }
      
      return true;
    });
  }, [publisherGames, selectedGameFilter, selectedUpdateFilter]);

  const formatReleaseDate = useCallback((value: string | null | undefined) => {
    if (!value) {
      return "Release date TBA";
    }

    try {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
        return "Release date TBA";
      }
      return `Released ${date.toLocaleDateString()}`;
    } catch {
      return "Release date TBA";
    }
  }, []);

  const publishedGames = publisherGames;

  const reportFilterOptions = useMemo(() => {
    const unique = new Map<number, string>();
    publishedGames.forEach((game) => {
      unique.set(game.id, game.title);
    });

    reports.forEach((report) => {
      if (report.gameId) {
        unique.set(report.gameId, report.gameTitle);
      }
    });

    return Array.from(unique.entries()).map(([id, title]) => ({ id, title }));
  }, [publishedGames, reports]);

  useEffect(() => {
    if (selectedReportFilter === "all") {
      return;
    }

    const exists = reportFilterOptions.some((option) => String(option.id) === selectedReportFilter);
    if (!exists) {
      setSelectedReportFilter("all");
    }
  }, [reportFilterOptions, selectedReportFilter]);

  const formatReportTime = useCallback((value: string) => {
    try {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
        return value;
      }
      return date.toLocaleString();
    } catch {
      return value;
    }
  }, []);

  const isInitialLoading =
    isRouteLoading ||
    authLoading ||
    (user?.role === "publisher" && !dashboard && isFetching);

  if (!authLoading && user && user.role !== "publisher") {
    return (
      <div className="publisher-page" style={{ justifyContent: "center", alignItems: "center" }}>
        <div className="publisher-empty-state" style={{ maxWidth: 360 }}>
          Redirecting… Publisher access required.
        </div>
        {notification && (
          <div className={`publisher-notification ${notification.type}`}>
            {notification.message}
          </div>
        )}
      </div>
    );
  }

  if (isInitialLoading) {
    return (
      <div
        className="publisher-page"
        style={{ justifyContent: "center", alignItems: "center" }}
      >
        <div className="publisher-empty-state" style={{ maxWidth: 320 }}>
          Loading publisher dashboard…
        </div>
      </div>
    );
  }

  return (
    <div className="publisher-page">
      <Header showSearch={false} />

      <main className="publisher-main">
        {error && (
          <div className="publisher-empty-state" style={{ borderStyle: "solid" }}>
            {error}
          </div>
        )}

        <div className="publisher-content-grid">
          <div className="publisher-primary-column">
            <section className="publisher-section">
              <div className="publisher-section-header">
                <h1 className="publisher-section-title">My Games</h1>
                <button type="button" className="publisher-upload-btn" onClick={handleUploadClick}>
                  Upload New Game
                </button>
              </div>

              <div>
                <div className="publisher-filters">
                  <div className="filter-group">
                    <label htmlFor="game-status-filter">Game Status:</label>
                    <select 
                      id="game-status-filter"
                      value={selectedGameFilter} 
                      onChange={(e) => setSelectedGameFilter(e.target.value)}
                      className="publisher-filter-select"
                    >
                      <option value="all">All Games</option>
                      <option value="Approve">Approved</option>
                      <option value="Reject">Rejected</option>
                      <option value="Pending">Pending</option>
                    </select>
                  </div>
                  <div className="filter-group">
                    <label htmlFor="update-status-filter">Update Status:</label>
                    <select 
                      id="update-status-filter"
                      value={selectedUpdateFilter} 
                      onChange={(e) => setSelectedUpdateFilter(e.target.value)}
                      className="publisher-filter-select"
                    >
                      <option value="all">All Updates</option>
                      <option value="Approve">Update Approved</option>
                      <option value="Reject">Update Rejected</option>
                      <option value="Pending">Update Pending</option>
                      <option value="none">No Updates</option>
                    </select>
                  </div>
                </div>
                
                <div className="publisher-label">
                  Games ({filteredGames.length} of {publisherGames.length})
                </div>
                {filteredGames.length > 0 ? (
                  <div className="publisher-games-grid">
                    {filteredGames.map((game) => {
                      const fallbackBanner = resolvePublisherGameImage(game.id);
                      const bannerSrc =
                        typeof game.bannerUrl === "string" && game.bannerUrl.trim().length > 0
                          ? game.bannerUrl
                          : fallbackBanner;
                      const statBlocks = [
                        {
                          label: "Total Players",
                          value: formatCompactNumber(game.metrics.total_players),
                          icon: <PlayersIcon />,
                        },
                        {
                          label: "Avg Playtime",
                          value: formatPlaytime(game.metrics.average_playtime),
                          icon: <PlaytimeIcon />,
                        },
                      ];

                      return (
                        <article key={String(game.id)} className="publisher-game-card">
                          <div className="publisher-game-status-badges">
                            <span className={`status-badge status-${game.gameStatus.toLowerCase()}`}>
                              Game: {game.gameStatus}
                            </span>
                            {game.updateStatus && (
                              <span className={`status-badge status-${game.updateStatus.toLowerCase()}`}>
                                Update: {game.updateStatus}
                              </span>
                            )}
                            {game.patchNumber !== null && (
                              <span className="patch-badge">
                                v{game.patchNumber}
                              </span>
                            )}
                          </div>
                          <img
                            src={bannerSrc}
                            alt={game.title}
                            className="publisher-game-banner"
                            onError={(event) => {
                              const target = event.target as HTMLImageElement;
                              if (target.dataset.fallbackApplied === "true") {
                                target.onerror = null;
                                return;
                              }
                              target.dataset.fallbackApplied = "true";
                              target.src = fallbackBanner;
                            }}
                          />
                          <div className="publisher-game-body">
                            <h3 className="publisher-game-title">{game.title}</h3>
                            <p className="publisher-game-description">
                              {game.description || "No description provided yet."}
                            </p>
                            <div className="publisher-game-meta">
                              <span>{formatReleaseDate(game.releaseDate)}</span>
                            </div>
                            <div className="publisher-game-stats">
                              {statBlocks.map((stat) => (
                                <div key={`${game.id}-${stat.label}`} className="publisher-stat-card">
                                  {stat.icon}
                                  <div style={{ display: "flex", flexDirection: "column" }}>
                                    <span style={{ fontSize: "0.75rem", color: "rgba(230, 224, 219, 0.65)" }}>
                                      {stat.label}
                                    </span>
                                    <span style={{ fontWeight: 600 }}>{stat.value}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div className="publisher-game-actions">
                              <button
                                type="button"
                                className="publisher-action-link"
                                onClick={() => handleGameAction("edit", game.id, game.title)}
                              >
                                EDIT
                              </button>
                              <button
                                type="button"
                                className="publisher-action-link"
                                onClick={() => handleGameAction("delete", game.id, game.title)}
                              >
                                DELETE
                              </button>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : publisherGames.length > 0 ? (
                  <div className="publisher-empty-state">
                    No games match the selected filters.
                  </div>
                ) : (
                  <div className="publisher-empty-state">
                    You have not published any games yet. Upload one to get started!
                  </div>
                )}
              </div>
            </section>
          </div>

          <aside className="publisher-reports-column">
            <section className="publisher-reports-section">
              <div className="publisher-reports-header">
                <h2 className="publisher-reports-title">Game Reports</h2>
                <select
                  className="publisher-report-filter"
                  value={selectedReportFilter}
                  onChange={(event) => setSelectedReportFilter(event.target.value)}
                >
                  <option value="all">All Games</option>
                  {reportFilterOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.title}
                    </option>
                  ))}
                </select>
              </div>

              {isLoadingReports ? (
                <div className="publisher-empty-state" style={{ textAlign: "left" }}>
                  Loading reports…
                </div>
              ) : reportsError ? (
                <div className="publisher-empty-state" style={{ textAlign: "left" }}>
                  {reportsError}
                </div>
              ) : reports.length === 0 ? (
                <div className="publisher-empty-state" style={{ textAlign: "left" }}>
                  No reports filed yet.
                </div>
              ) : (
                <div className="publisher-reports-list">
                  {reports.map((report) => (
                    <article key={report.id} className="publisher-report-card">
                      <header className="publisher-report-card-header">
                        <div>
                          <h3 className="publisher-report-game">{report.gameTitle}</h3>
                          <span className="publisher-report-topic">{report.topic}</span>
                        </div>
                        <time className="publisher-report-time">{formatReportTime(report.reportedAt)}</time>
                      </header>
                      <p className="publisher-report-detail">{report.detail}</p>
                      <footer className="publisher-report-footer">
                        <span>Reporter: {report.reporter}</span>
                        <button
                          type="button"
                          className="publisher-report-filter-link"
                          onClick={() => setSelectedReportFilter(String(report.gameId))}
                        >
                          View all for this game
                        </button>
                      </footer>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </aside>
        </div>
      </main>

      {notification && (
        <div className={`publisher-notification ${notification.type}`}>
          {notification.message}
        </div>
      )}

      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={handleUploadSuccess}
        showNotification={showNotification}
      />

      <EditGameModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setGameBeingEdited(null);
        }}
        onSuccess={(payload) => {
          handleEditSuccess(payload);
          setGameBeingEdited((previous) =>
            previous && previous.id === payload.id
              ? {
                  ...previous,
                  title: payload.title,
                }
              : previous
          );
        }}
        game={gameBeingEdited}
        showNotification={showNotification}
      />
    </div>
  );
}
