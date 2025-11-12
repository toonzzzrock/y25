"use client";
import React, { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useProtectedRoute } from "@/lib/use-protected-route";
import Header from "@/app/components/Header";
import { getAllCategories } from "@/lib/data/categoriesUtils";
import "../home.css";

type GameSummary = {
  id: number | string;
  title: string;
  description?: string | null;
  developer?: string | null;
  releaseDate?: string | null;
  genre?: string | null;
  cardImage?: string | null;
};
type NormalizedGame = GameSummary & {
  image_url?: string | null;
  release_date?: string | null;
};
type HomeThreadSummary = {
  thread_name: string;
  detail: string | null;
  created_at: string | null;
  creator_username: string | null;
  reply_count: number;
  game_name: string | null;
};
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

const toGameSummary = (game: any, fallbackIndex: number = 0): GameSummary => {
  const rawId = game?.id ?? game?.game_id ?? fallbackIndex + 1;
  const numericId = typeof rawId === "number" ? rawId : Number(rawId);
  const safeId = Number.isFinite(numericId) ? numericId : fallbackIndex + 1;

  return {
    id: safeId,
    title: game?.title ?? game?.game_name ?? `Game ${safeId}`,
    description: game?.description ?? game?.detail ?? null,
    developer: game?.developer ?? game?.publisher_username ?? null,
    releaseDate: game?.release_date ?? game?.releaseDate ?? null,
    genre: game?.genre ?? null,
    cardImage: resolveGameImage(safeId),
  };
};

const toNormalizedGame = (game: any, fallbackIndex: number = 0): NormalizedGame => {
  const summary = toGameSummary(game, fallbackIndex);
  return {
    ...summary,
    description: summary.description ?? game?.description ?? game?.detail ?? null,
    developer: summary.developer ?? game?.publisher_username ?? null,
    releaseDate: summary.releaseDate ?? game?.release_date ?? game?.releaseDate ?? null,
    genre: summary.genre ?? game?.genre ?? null,
    cardImage: summary.cardImage ?? game?.cardImage ?? game?.image_url ?? '/images/placeholder.svg',
    image_url: game?.image_url ?? summary.cardImage ?? '/images/placeholder.svg',
    release_date: game?.release_date ?? null,
  };
};

const normalizeGameList = (games: any[] | undefined | null, startIndex: number = 0): NormalizedGame[] => {
  if (!Array.isArray(games) || games.length === 0) {
    return [];
  }

  return games.map((game, index) => toNormalizedGame(game, startIndex + index));
};

export default function HomePage() {
  // All hooks must be called unconditionally at the top
  const { isLoading } = useProtectedRoute();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [notification, setNotification] = useState<{ message: string; type: string } | null>(null);
  const [searchResults, setSearchResults] = useState<NormalizedGame[]>([]);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<NormalizedGame[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [categoryGames, setCategoryGames] = useState<NormalizedGame[]>([]);
  const [isLoadingCategory, setIsLoadingCategory] = useState(false);
  const [latestThreads, setLatestThreads] = useState<HomeThreadSummary[]>([]);
  const [isLoadingCommunity, setIsLoadingCommunity] = useState(true);
  const [communityError, setCommunityError] = useState<string | null>(null);
  const [allGamesLibrary, setAllGamesLibrary] = useState<NormalizedGame[]>([]);
  const [isLoadingAllGames, setIsLoadingAllGames] = useState(false);
  const [allGamesError, setAllGamesError] = useState<string | null>(null);
  const [trendingGames, setTrendingGames] = useState<NormalizedGame[]>([]);
  const [newGames, setNewGames] = useState<NormalizedGame[]>([]);
  const allCategories = getAllCategories();

  const showNotification = useCallback((message: string, type: string = "info") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const loadLatestThreads = async () => {
      setIsLoadingCommunity(true);
      setCommunityError(null);

      try {
        const response = await fetch(`/api/forum/threads?limit=5`, { signal: controller.signal });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || 'Failed to load latest threads');
        }

        const normalized: HomeThreadSummary[] = Array.isArray(data.threads)
          ? (data.threads as any[]).slice(0, 5).map((thread) => ({
              thread_name: thread.thread_name,
              detail: thread.detail ?? null,
              created_at: thread.created_at ?? null,
              creator_username: thread.creator_username ?? null,
              reply_count: Number(thread.reply_count ?? 0),
              game_name: thread.game_name ?? null,
            }))
          : [];

        setLatestThreads(normalized);
      } catch (error: any) {
        if (error?.name === 'AbortError') {
          return;
        }

        console.error('Latest threads fetch error:', error);
        setCommunityError('Failed to load latest threads');
        showNotification('Failed to load latest threads', 'error');
      } finally {
        setIsLoadingCommunity(false);
      }
    };

    loadLatestThreads();

    return () => {
      controller.abort();
    };
  }, [showNotification]);

  useEffect(() => {
    const controller = new AbortController();

    const loadAllGames = async () => {
      setIsLoadingAllGames(true);
      setAllGamesError(null);

      try {
        const response = await fetch(`/api/games?limit=40`, { signal: controller.signal });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || 'Failed to load games');
        }

        const games = Array.isArray(data.games) ? data.games : [];
        const normalized = normalizeGameList(games);

        setAllGamesLibrary(normalized);

        const trendingCount = Math.min(8, normalized.length);
        const trendingList = normalized.slice(0, trendingCount);
        const newList = normalized.slice(trendingCount, trendingCount + 8);

        setTrendingGames(trendingList);
        setNewGames(newList.length > 0 ? newList : trendingList);
      } catch (error: any) {
        if (error?.name === 'AbortError') {
          return;
        }

        console.error('All games fetch error:', error);
        setAllGamesError('Failed to load games');
        showNotification('Failed to load games', 'error');
      } finally {
        setIsLoadingAllGames(false);
      }
    };

    loadAllGames();

    return () => {
      controller.abort();
    };
  }, [showNotification]);

  // Fetch games for selected category
  const fetchCategoryGames = useCallback(async (categoryId: string) => {
    if (categoryId === "all") {
      setCategoryGames([]);
      return;
    }

    setCategoryGames([]);
    setIsLoadingCategory(true);
    try {
      const response = await fetch(`/api/games/category/${categoryId}`);
      const data = await response.json();
      const categoryName = data?.category || categoryId.toUpperCase();

      if (response.ok && data.games && data.games.length > 0) {
  setCategoryGames(normalizeGameList(data.games));
        showNotification(`Found ${data.games.length} ${categoryName} game${data.games.length === 1 ? '' : 's'}`, "success");
      } else {
        setCategoryGames([]);
        showNotification(`No games found for ${categoryName}`, "info");
      }
    } catch (error) {
      console.error('Category fetch error:', error);
      setCategoryGames([]);
      showNotification("Failed to load category games", "error");
    } finally {
      setIsLoadingCategory(false);
    }
  }, [showNotification]);

  // Handle real-time search as user types
  const handleSearchChange = useCallback(async (value: string) => {
    setSearchQuery(value);

    if (value.trim().length < 2) {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const categoryQuery =
      activeCategory !== "all" ? `&category=${encodeURIComponent(activeCategory)}` : "";

    try {
      const response = await fetch(`/api/games/search?q=${encodeURIComponent(value)}${categoryQuery}`);
      const data = await response.json();

      if (response.ok && data.games && data.games.length > 0) {
        setSearchSuggestions(normalizeGameList(data.games.slice(0, 5)));
        setShowSuggestions(true);
      } else {
        setSearchSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error('Search suggestion error:', error);
      setSearchSuggestions([]);
    }
  }, [activeCategory]);

  const executeSearch = useCallback(
    async (categoryId: string, options?: { silent?: boolean }) => {
      const silent = options?.silent ?? false;
      const q = searchQuery.trim();

      if (!q) {
        if (!silent) {
          showNotification("Please enter a search query", "info");
        }
        setSearchResults([]);
        setSearchPerformed(false);
        return;
      }

      if (q.length < 2) {
        if (!silent) {
          showNotification("Search query must be at least 2 characters", "info");
        }
        setSearchResults([]);
        setSearchPerformed(false);
        return;
      }

      setIsSearching(true);
      setShowSuggestions(false);

      const categoryData =
        categoryId !== "all" ? allCategories.find((category) => category.id === categoryId) : undefined;
      const categorySuffix = categoryData ? ` in ${categoryData.name}` : "";
      const categoryQuery = categoryId !== "all" ? `&category=${encodeURIComponent(categoryId)}` : "";

      try {
        const response = await fetch(`/api/games/search?q=${encodeURIComponent(q)}${categoryQuery}`);
        const data = await response.json();

        if (!searchPerformed) {
          setSearchPerformed(true);
        }

        if (response.ok && data.games && data.games.length > 0) {
          setSearchResults(normalizeGameList(data.games));
          if (!silent) {
            const plural = data.games.length === 1 ? "" : "s";
            showNotification(`Found ${data.games.length} game${plural}${categorySuffix}`, "success");
          }
        } else {
          setSearchResults([]);
          if (!silent) {
            showNotification(`No games found matching your query${categorySuffix}`, "info");
          }
        }
      } catch (error) {
        console.error('Search error:', error);
        showNotification("Failed to search games", "error");
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    [allCategories, searchPerformed, searchQuery, showNotification]
  );

  const handleSearch = useCallback(async () => {
    await executeSearch(activeCategory);
  }, [activeCategory, executeSearch]);

  const navigateToGame = useCallback(
    (gameId: number | string) => {
      router.push(`/games/${encodeURIComponent(String(gameId))}`);
    },
    [router]
  );

  function handleSuggestionClick(suggestion: any) {
    setSearchQuery(suggestion.title);
    setShowSuggestions(false);
    setSearchPerformed(true);
    // Perform search with the selected game
    setTimeout(() => {
      setSearchResults([suggestion]);
      showNotification(`Viewing ${suggestion.title}`, "success");
    }, 100);
  }

  const renderDynamicGameCard = (game: any, index: number) => {
    const rawId = game?.id ?? game?.game_id ?? index + 1;
    const gameId = typeof rawId === 'string' || typeof rawId === 'number' ? rawId : index + 1;
    const title = game?.title || game?.game_name || `Game ${index + 1}`;
    const imageSrc = game?.cardImage || game?.image_url || resolveGameImage(gameId);
    const releaseRaw = game?.release_date || game?.releaseDate;
    let releaseLabel: string | null = null;

    if (releaseRaw) {
      try {
        const parsedDate = new Date(releaseRaw);
        if (!Number.isNaN(parsedDate.getTime())) {
          releaseLabel = `Released ${parsedDate.toLocaleDateString()}`;
        } else if (typeof releaseRaw === 'string') {
          releaseLabel = releaseRaw;
        }
      } catch {
        releaseLabel = typeof releaseRaw === 'string' ? releaseRaw : null;
      }
    }

    const secondaryLabel = game?.genre || game?.developer || releaseLabel || null;

    const handleNavigate = () => {
      navigateToGame(gameId);
    };

    return (
      <div
        key={String(gameId)}
        style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
      >
        <div
          className="game-card"
          role="button"
          tabIndex={0}
          onClick={handleNavigate}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              handleNavigate();
            }
          }}
        >
          <img
            src={imageSrc}
            alt={title}
            className="game-image"
            onError={(event) => {
              (event.target as HTMLImageElement).src = '/images/placeholder.svg';
            }}
          />
          <div className="game-overlay">
            <button
              className="play-btn"
              onClick={(event) => {
                event.stopPropagation();
                handleNavigate();
              }}
            >
              Play Now
            </button>
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <p
            style={{
              margin: '0',
              fontSize: '0.9rem',
              fontWeight: 500,
              color: '#fff',
            }}
          >
            {title}
          </p>
          {secondaryLabel && (
            <p
              style={{
                margin: '0',
                fontSize: '0.75rem',
                color: '#ff6600',
              }}
            >
              {secondaryLabel}
            </p>
          )}
        </div>
      </div>
    );
  };

  const formatThreadMeta = useCallback((thread: HomeThreadSummary) => {
    const parts: string[] = [];

    if (thread.creator_username) {
      parts.push(`by ${thread.creator_username}`);
    }

    const repliesLabel = `${thread.reply_count} repl${thread.reply_count === 1 ? 'y' : 'ies'}`;
    parts.push(repliesLabel);

    if (thread.game_name) {
      parts.push(thread.game_name);
    }

    if (thread.created_at) {
      try {
        parts.push(new Date(thread.created_at).toLocaleDateString());
      } catch {
        parts.push(thread.created_at);
      }
    }

    return parts.join(' • ');
  }, []);

  const activeCategoryConfig =
    activeCategory !== 'all'
      ? allCategories.find((category) => category.id === activeCategory)
      : undefined;
  const activeCategoryLabel = activeCategoryConfig?.name.toUpperCase() || 'CATEGORY';

  const displayGames =
    searchPerformed
      ? searchResults
      : activeCategory !== 'all'
        ? categoryGames
        : [];

  const shouldShowResultsSection = searchPerformed || activeCategory !== 'all';
  const sectionTitle = searchPerformed ? 'SEARCH RESULTS' : `${activeCategoryLabel} GAMES`;
  const noResultsMessage = searchPerformed
    ? `No games found matching your query${activeCategory !== 'all' ? ' in this category' : ''}.`
    : 'No games found for this category yet.';
  const isLoadingResults = searchPerformed
    ? isSearching
    : activeCategory !== 'all'
      ? isLoadingCategory
      : false;

  // Show loading screen while checking authentication
  // This early return happens AFTER all hooks are called
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#1a1a1a',
        color: '#fff',
        fontSize: '1.2rem'
      }}>
        Loading...
      </div>
    );
  }

  return (
    <>
      <Header
        showSearch={true}
        searchValue={searchQuery}
        onSearchChange={handleSearchChange}
        onSearch={() => handleSearch()}
        onSuggestionClick={handleSuggestionClick}
        searchSuggestions={searchSuggestions}
        showSuggestions={showSuggestions}
      />
      <nav className="category-nav">
        {allCategories.map((category) => (
          <button
            key={category.id}
            className={`category-btn ${activeCategory === category.id ? "active" : ""}`}
            onClick={() => {
              if (activeCategory === category.id) {
                // If clicking the active category, deselect it
                setActiveCategory("all");
                setCategoryGames([]);
                showNotification("Cleared category filter", "info");
                if (searchPerformed) {
                  executeSearch("all", { silent: true });
                }
              } else {
                // If clicking a different category, select it
                setActiveCategory(category.id);
                fetchCategoryGames(category.id);
                if (searchPerformed) {
                  executeSearch(category.id, { silent: true });
                }
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              backgroundColor: activeCategory === category.id ? 'rgba(255, 87, 34, 0.3)' : 'transparent',
              border: activeCategory === category.id ? '1px solid rgba(255, 87, 34, 0.6)' : '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '0.95rem',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              if (activeCategory !== category.id) {
                (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255, 87, 34, 0.15)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeCategory !== category.id) {
                (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
              }
            }}
          >
            <span>{category.icon}</span>
            <span>{category.name}</span>
          </button>
        ))}

        <button
          className="nav-arrow-btn"
          onClick={(e) => {
            const nav = (e.currentTarget.parentElement as HTMLElement);
            nav.scrollBy({ left: 200, behavior: "smooth" });
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </nav>
      <main className="home-main">
        <div className="content-wrapper">
          <div className="main-content">
            {shouldShowResultsSection && (
              <section className="game-section">
                <div className="section-header">
                  <h2 className="section-title">{sectionTitle}</h2>
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
                    {searchPerformed && (
                      <button
                        className="section-arrow"
                        onClick={() => {
                          setSearchResults([]);
                          setSearchQuery('');
                          setSearchPerformed(false);
                          setIsSearching(false);
                          setSearchSuggestions([]);
                          setShowSuggestions(false);
                          if (activeCategory !== 'all') {
                            fetchCategoryGames(activeCategory);
                          }
                        }}
                      >
                        ✕ Clear Search
                      </button>
                    )}
                    {activeCategory !== 'all' && (
                      <button
                        className="section-arrow"
                        onClick={() => {
                          setActiveCategory('all');
                          setCategoryGames([]);
                          showNotification('Cleared category filter', 'info');
                          if (searchPerformed) {
                            executeSearch('all', { silent: true });
                          }
                        }}
                      >
                        ✕ Clear Tag
                      </button>
                    )}
                  </div>
                </div>
                {isLoadingResults ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#fff' }}>
                    {searchPerformed ? 'Searching for games...' : 'Loading category games...'}
                  </div>
                ) : displayGames.length > 0 ? (
                  <div className="game-grid trending-grid">
                    {displayGames.map((game, index) => renderDynamicGameCard(game, index))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#fff' }}>
                    {noResultsMessage}
                  </div>
                )}
              </section>
            )}

            {!shouldShowResultsSection && (
              <>
                <section className="game-section">
                  <div className="section-header">
                    <h2 className="section-title">TRENDING</h2>
                    <button className="section-arrow" onClick={() => showNotification('Loading more trending games...', 'info')}>
                      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 8L20 16L12 24" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>
                  <div className="game-grid trending-grid">
                    {trendingGames.map((game, index) => renderDynamicGameCard(game, index))}
                  </div>
                </section>
                <section className="game-section">
                  <div className="section-header">
                    <h2 className="section-title">NEW GAME</h2>
                    <button className="section-arrow" onClick={() => showNotification('Loading more new games...', 'info')}>
                      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 8L20 16L12 24" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>
                  <div className="game-grid newgame-grid">
                    {newGames.map((game, index) => renderDynamicGameCard(game, index))}
                  </div>
                </section>
                <section className="game-section">
                  <div className="section-header">
                    <h2 className="section-title">ALL GAMES</h2>
                    <button
                      className="section-arrow"
                      onClick={() => showNotification('Browse the full library coming soon!', 'info')}
                    >
                      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 8L20 16L12 24" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>
                  {isLoadingAllGames ? (
                    <div style={{ color: '#c7b7b0', fontSize: '0.9rem' }}>Loading games…</div>
                  ) : allGamesError ? (
                    <div style={{ color: '#c7b7b0', fontSize: '0.9rem' }}>{allGamesError}</div>
                  ) : allGamesLibrary.length > 0 ? (
                    <div className="game-grid all-games-grid">
                      {allGamesLibrary.map((game, index) => renderDynamicGameCard(game, index))}
                    </div>
                  ) : (
                    <div style={{ color: '#c7b7b0', fontSize: '0.9rem' }}>No games available yet.</div>
                  )}
                </section>
              </>
            )}
          </div>
          <aside className="community-sidebar">
            <div className="community-header">
              <div className="community-icon" />
              <h3 className="community-title">COMMUNITY</h3>
            </div>
            <div className="popular-hubs">
              <h4 className="hubs-title">Latest Threads</h4>
              <div className="hub-list">
                {isLoadingCommunity ? (
                  <div className="hub-empty">Loading latest threads…</div>
                ) : communityError ? (
                  <div className="hub-empty">{communityError}</div>
                ) : latestThreads.length > 0 ? (
                  latestThreads.map((thread) => {
                    const meta = formatThreadMeta(thread);
                    return (
                      <div
                        key={thread.thread_name}
                        className="hub-item"
                        onClick={() => router.push(`/forum/${encodeURIComponent(thread.thread_name)}`)}
                      >
                        <img
                          src="/images/placeholder.svg"
                          alt={thread.thread_name}
                          className="hub-avatar"
                        />
                        <div className="hub-info">
                          <h5 className="hub-name">{thread.thread_name}</h5>
                          <p className="hub-stats">{meta}</p>
                          {thread.detail && (
                            <p className="hub-detail">{thread.detail}</p>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="hub-empty">No threads yet. Be the first to start one!</div>
                )}
              </div>
              <button className="view-more-btn" onClick={() => router.push('/forum')}>Go to forum</button>
            </div>
          </aside>
        </div>
      </main>
      {notification && (
        <div
          className="notification"
          style={{
            position: "fixed",
            top: 20,
            right: 20,
            padding: "1rem 1.5rem",
            borderRadius: 8,
            backgroundColor:
              notification.type === "error"
                ? "#f44336"
                : notification.type === "success"
                ? "#4caf50"
                : "#2196f3",
            color: "white",
            fontWeight: 600,
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            zIndex: 1000,
            animation: "slideInNotification 0.3s ease-out",
            maxWidth: 350,
          }}
        >
          {notification.message}
        </div>
      )}
    </>
  );
}
