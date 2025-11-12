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
import "./publisher.css";

type NotificationVariant = "success" | "error" | "info";

type PublisherSummary = {
  username: string;
  accountName: string | null;
};

type PublishedGame = {
  id: number;
  title: string;
  description: string | null;
  bannerUrl: string | null;
  releaseDate: string | null;
  metrics: {
    players: number | null;
    rating: number | null;
    comments: number | null;
    revenue: number | null;
  };
};

type SubmissionStatus = "waiting" | "approved" | "rejected";

type Submission = {
  id: number;
  title: string;
  status: SubmissionStatus;
  updatedAt: string | null;
};

type DashboardData = {
  publisher: PublisherSummary | null;
  publishedGames: PublishedGame[];
  submissions: Submission[];
};

type NotificationState = {
  message: string;
  type: NotificationVariant;
};

const STATUS_LABEL: Record<SubmissionStatus, string> = {
  waiting: "Waiting",
  approved: "Approved",
  rejected: "Rejected",
};

function PlayersIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5s-3 1.34-3 3 1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
    </svg>
  );
}

function RatingIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 17.27L18.18 21 16.54 13.97 22 9.24l-7.19-.62L12 2 9.19 8.62 2 9.24l5.46 4.73L5.82 21z" />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
    </svg>
  );
}

function RevenueIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C8.13 2 5 5.13 5 9h2c0-2.76 2.24-5 5-5s5 2.24 5 5c0 2.21-1.45 4.08-3.45 4.73l-.55.18V21h-2v-6.09c-2.89-.86-5-3.54-5-6.91H5c0 3.87 2.69 7.16 6.26 7.86l.74.13V23h2v-6.9c3.45-.89 6-4.02 6-7.97 0-4.42-3.58-8-8-8z" />
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

function statusClassName(status: SubmissionStatus): string {
  switch (status) {
    case "approved":
      return "publisher-status-pill publisher-status-approved";
    case "rejected":
      return "publisher-status-pill publisher-status-rejected";
    default:
      return "publisher-status-pill publisher-status-waiting";
  }
}

function statusIcon(status: SubmissionStatus) {
  switch (status) {
    case "approved":
      return <ApprovedIcon />;
    case "rejected":
      return <RejectedIcon />;
    default:
      return <WaitingIcon />;
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

  return `/data/game/${numericId}/game_profile.svg`;
};

const mapApiGameToPublished = (game: any, fallbackIndex: number = 0): PublishedGame => {
  const rawId = game?.id ?? game?.game_id ?? fallbackIndex + 1;
  const numericId = Number(rawId);
  const safeId = Number.isFinite(numericId) && numericId > 0 ? numericId : fallbackIndex + 1;
  const rawRelease = game?.release_date ?? game?.releaseDate ?? null;

  return {
    id: safeId,
    title: game?.title ?? game?.game_name ?? `Game ${safeId}`,
    description: game?.description ?? game?.detail ?? null,
    bannerUrl:
      typeof game?.image_url === "string" && game.image_url.trim().length > 0
        ? game.image_url
        : resolvePublisherGameImage(safeId),
    releaseDate: rawRelease,
    metrics: {
      players: typeof game?.metrics?.players === "number" ? game.metrics.players : null,
      rating: typeof game?.metrics?.rating === "number" ? game.metrics.rating : null,
      comments: typeof game?.metrics?.comments === "number" ? game.metrics.comments : null,
      revenue: typeof game?.metrics?.revenue === "number" ? game.metrics.revenue : null,
    },
  };
};

const mergePublishedGameLists = (current: PublishedGame[], incoming: PublishedGame[]): PublishedGame[] => {
  if (!Array.isArray(incoming) || incoming.length === 0) {
    return current;
  }

  const currentMap = new Map<number, PublishedGame>();
  current.forEach((game) => currentMap.set(game.id, game));

  const merged: PublishedGame[] = [];

  incoming.forEach((game) => {
    const existing = currentMap.get(game.id);
    if (existing) {
      merged.push({
        ...existing,
        ...game,
        metrics: {
          players: game.metrics.players ?? existing.metrics.players ?? null,
          rating: game.metrics.rating ?? existing.metrics.rating ?? null,
          comments: game.metrics.comments ?? existing.metrics.comments ?? null,
          revenue: game.metrics.revenue ?? existing.metrics.revenue ?? null,
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

export default function PublisherPage() {
  const { isLoading: isRouteLoading } = useProtectedRoute();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<NotificationState | null>(null);
  const [publisherGames, setPublisherGames] = useState<PublishedGame[]>([]);
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
          const normalized: DashboardData = {
            publisher: data?.publisher ?? null,
            publishedGames: Array.isArray(data?.publishedGames)
              ? (data.publishedGames as any[]).map((game, index) => ({
                  id: Number.isFinite(Number(game?.id ?? game?.game_id))
                    ? Number(game?.id ?? game?.game_id)
                    : index + 1,
                  title: game?.title ?? game?.game_name ?? "Untitled Game",
                  description: game?.description ?? game?.detail ?? null,
                  bannerUrl: game?.bannerUrl ?? game?.link_to_file ?? null,
                  releaseDate: game?.releaseDate ?? game?.release_date ?? null,
                  metrics: {
                    players:
                      typeof game?.metrics?.players === "number"
                        ? game.metrics.players
                        : typeof game?.player_count === "number"
                        ? game.player_count
                        : null,
                    rating:
                      typeof game?.metrics?.rating === "number"
                        ? game.metrics.rating
                        : typeof game?.average_rating === "number"
                        ? game.average_rating
                        : null,
                    comments:
                      typeof game?.metrics?.comments === "number"
                        ? game.metrics.comments
                        : typeof game?.comment_count === "number"
                        ? game.comment_count
                        : null,
                    revenue:
                      typeof game?.metrics?.revenue === "number"
                        ? game.metrics.revenue
                        : typeof game?.total_revenue === "number"
                        ? game.total_revenue
                        : null,
                  },
                }))
              : [],
            submissions: Array.isArray(data?.submissions)
              ? (data.submissions as any[]).map((submission, index) => ({
                  id:
                    typeof submission?.id === "number"
                      ? submission.id
                      : Number.isFinite(Number(submission?.id))
                      ? Number(submission.id)
                      : index + 1,
                  title: submission?.title ?? submission?.game_name ?? "Untitled Game",
                  status: ((): SubmissionStatus => {
                    const raw = String(submission?.status ?? "waiting").toLowerCase();
                    if (raw.includes("approve")) {
                      return "approved";
                    }
                    if (raw.includes("reject")) {
                      return "rejected";
                    }
                    return "waiting";
                  })(),
                  updatedAt:
                    submission?.updatedAt ??
                    submission?.updated_at ??
                    submission?.createdAt ??
                    submission?.created_at ??
                    null,
                }))
              : [],
          };
          setDashboard(normalized);
          setPublisherGames(normalized.publishedGames);
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

        setPublisherGames((previous) => mergePublishedGameLists(previous, normalized));
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

  const handleUploadClick = useCallback(() => {
    showNotification("Game upload workflow coming soon!", "info");
  }, [showNotification]);

  const handleGameAction = useCallback(
    (action: "edit" | "delete", title: string) => {
      const verb = action === "edit" ? "Editing" : "Deleting";
      showNotification(`${verb} "${title}" is not available yet.`, "info");
    },
    [showNotification]
  );

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

  const publisherName = useMemo(() => {
    if (dashboard?.publisher?.accountName) {
      return dashboard.publisher.accountName;
    }
    if (dashboard?.publisher?.username) {
      return dashboard.publisher.username;
    }
    if (user?.username) {
      return user.username;
    }
    return "Publisher";
  }, [dashboard?.publisher, user?.username]);

  const publishedGames = publisherGames;
  const submissions = dashboard?.submissions ?? [];

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

        <section className="publisher-section">
          <div className="publisher-section-header">
            <h1 className="publisher-section-title">My Games</h1>
            <button type="button" className="publisher-upload-btn" onClick={handleUploadClick}>
              Upload New Game
            </button>
          </div>

          <div>
            <div className="publisher-label">Published</div>
            {publishedGames.length > 0 ? (
              <div className="publisher-games-grid">
                {publishedGames.map((game) => {
                  const statBlocks = [
                    {
                      label: "Players",
                      value: formatCompactNumber(game.metrics.players),
                      icon: <PlayersIcon />,
                    },
                    {
                      label: "Rating",
                      value:
                        game.metrics.rating !== null && game.metrics.rating !== undefined
                          ? `${formatRating(game.metrics.rating)}/10`
                          : "—",
                      icon: <RatingIcon />,
                    },
                    {
                      label: "Comments",
                      value: formatCompactNumber(game.metrics.comments),
                      icon: <CommentIcon />,
                    },
                    {
                      label: "Revenue",
                      value: formatCurrency(game.metrics.revenue),
                      icon: <RevenueIcon />,
                    },
                  ];

                  return (
                    <article key={`${game.id}-${game.title}`} className="publisher-game-card">
                      <img
                        src={game.bannerUrl || "/images/placeholder.svg"}
                        alt={game.title}
                        className="publisher-game-banner"
                        onError={(event) => {
                          (event.target as HTMLImageElement).src = "/images/placeholder.svg";
                        }}
                      />
                      <div className="publisher-game-body">
                        <h3 className="publisher-game-title">{game.title}</h3>
                        <p className="publisher-game-description">
                          {game.description || "No description provided yet."}
                        </p>
                        <div className="publisher-game-meta">
                          <span>{formatReleaseDate(game.releaseDate)}</span>
                          <span>By {publisherName}</span>
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
                            onClick={() => handleGameAction("edit", game.title)}
                          >
                            EDIT
                          </button>
                          <button
                            type="button"
                            className="publisher-action-link"
                            onClick={() => handleGameAction("delete", game.title)}
                          >
                            DELETE
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="publisher-empty-state">
                You have not published any games yet. Upload one to get started!
              </div>
            )}
          </div>

          <div style={{ marginTop: "32px" }}>
            <div className="publisher-label">In process</div>
            {submissions.length > 0 ? (
              <div className="publisher-submissions-list">
                {submissions.map((submission) => (
                  <div key={`${submission.id}-${submission.title}`} className="publisher-submission-card">
                    <div>
                      <p className="publisher-submission-title">{submission.title}</p>
                      <div className="publisher-submission-meta">
                        <span>{formatUpdatedAt(submission.updatedAt)}</span>
                        <span>Submitted by {publisherName}</span>
                      </div>
                    </div>
                    <span className={statusClassName(submission.status)}>
                      {statusIcon(submission.status)}
                      {STATUS_LABEL[submission.status]}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="publisher-empty-state">
                No submissions in review. Upload a new game to start the approval process.
              </div>
            )}
          </div>
        </section>
      </main>

      {notification && (
        <div className={`publisher-notification ${notification.type}`}>
          {notification.message}
        </div>
      )}
    </div>
  );
}
