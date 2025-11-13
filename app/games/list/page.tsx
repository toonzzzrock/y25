"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useProtectedRoute } from "@/lib/use-protected-route";
import Header from "@/app/components/Header";
import "../../home.css";

type GameSummary = {
  id: number | string;
  title: string;
  description?: string | null;
  developer?: string | null;
  releaseDate?: string | null;
  total_players?: number | null;
  image_url?: string | null;
};

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

const normalizeGame = (game: any): GameSummary => {
  const rawId = game?.id ?? game?.game_id;
  const numericId = typeof rawId === "number" ? rawId : Number(rawId);
  const safeId = Number.isFinite(numericId) ? numericId : 0;

  return {
    id: safeId,
    title: game?.title || game?.game_name || `Game ${safeId}`,
    description: game?.description || game?.detail || null,
    developer: game?.developer || game?.publisher_username || null,
    releaseDate: game?.release_date || game?.releaseDate || null,
    total_players: typeof game?.total_players === 'number' ? game.total_players : null,
    image_url: resolveGameImage(safeId),
  };
};

const getTypeInfo = (type: string) => {
  switch (type) {
    case 'trending':
      return {
        title: 'TRENDING BY PLAYERS',
        description: 'Games ranked by total player count',
        endpoint: '/api/games/trending'
      };
    case 'new':
      return {
        title: 'NEW GAMES',
        description: 'Latest released games',
        endpoint: '/api/games/new'
      };
    case 'all':
      return {
        title: 'ALL GAMES',
        description: 'Complete game library',
        endpoint: '/api/games/all'
      };
    default:
      return {
        title: 'GAMES',
        description: 'Browse games',
        endpoint: '/api/games'
      };
  }
};

export default function GamesListPage() {
  const { isLoading: authLoading } = useProtectedRoute();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const type = searchParams?.get('type') || 'all';
  const typeInfo = getTypeInfo(type);
  
  const [games, setGames] = useState<GameSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 20,
    offset: 0,
    hasMore: false
  });

  const fetchGames = useCallback(async (offset = 0) => {
    try {
      setLoading(true);
      setError(null);

      const url = new URL(typeInfo.endpoint, window.location.origin);
      // For trending and new games, load all at once. For all games, use pagination
      const limit = (type === 'trending' || type === 'new') ? 100 : 20;
      url.searchParams.set('limit', limit.toString());
      url.searchParams.set('offset', offset.toString());

      console.log(`[FetchGames] Fetching from: ${url.toString()}`);
      const response = await fetch(url.toString());
      const data = await response.json();

      console.log(`[FetchGames] Response status: ${response.status}, Games count: ${data.games?.length || 0}`);
      
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to fetch games');
      }

      const normalizedGames = (data.games || []).map(normalizeGame);
      console.log(`[FetchGames] Normalized games:`, normalizedGames.map((g: GameSummary) => ({ id: g.id, title: g.title, image_url: g.image_url })));
      
      if (offset === 0) {
        setGames(normalizedGames);
      } else {
        setGames(prev => [...prev, ...normalizedGames]);
      }

      setPagination({
        total: data.total || 0,
        limit: data.limit || limit,
        offset: data.offset || 0,
        hasMore: (data.offset || 0) + (data.limit || limit) < (data.total || 0)
      });

    } catch (err: any) {
      console.error('Games fetch error:', err);
      setError(err.message || 'Failed to fetch games');
    } finally {
      setLoading(false);
    }
  }, [typeInfo.endpoint, type]);

  useEffect(() => {
    if (!authLoading) {
      fetchGames(0);
    }
  }, [authLoading, fetchGames]);

  const handleLoadMore = () => {
    if (pagination.hasMore && !loading) {
      fetchGames(pagination.offset + pagination.limit);
    }
  };

  const navigateToGame = (gameId: string | number) => {
    router.push(`/games/${gameId}`);
  };

  const renderGameCard = (game: GameSummary, index: number) => {
    const imageSrc = game.image_url || resolveGameImage(game.id);
    const playerCount = game.total_players || 0;
    
    console.log(`[GameCard] Game: ${game.title} (ID: ${game.id}), ImageSrc: ${imageSrc}`);
    
    const formatPlayerCount = (count: number) => {
      if (count >= 1000000) {
        return `${(count / 1000000).toFixed(1)}M players`;
      } else if (count >= 1000) {
        return `${(count / 1000).toFixed(1)}K players`;
      } else {
        return `${count} player${count !== 1 ? 's' : ''}`;
      }
    };

    const handleNavigate = () => {
      navigateToGame(game.id);
    };

    return (
      <div
        key={String(game.id)}
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
          {type === 'trending' && (
            <div className="trending-rank">#{index + 1}</div>
          )}
          <img
            src={imageSrc}
            alt={game.title}
            className="game-image"
            onError={(event) => {
              // Fall back to placeholder if API fails
              console.error(`[ImageError] Failed to load image for ${game.title} (${game.id}): ${imageSrc}`);
              (event.target as HTMLImageElement).src = '/images/placeholder.svg';
            }}
            onLoad={() => {
              console.log(`[ImageLoaded] Successfully loaded image for ${game.title} (${game.id})`);
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
            {game.title}
          </p>
          <p
            style={{
              margin: '0',
              fontSize: '0.75rem',
              color: '#ff6600',
              fontWeight: type === 'trending' ? 600 : 400,
            }}
          >
            {type === 'trending' ? formatPlayerCount(playerCount) : 
             game.developer || 'Unknown Developer'}
          </p>
        </div>
      </div>
    );
  };

  if (authLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(180deg, #1a0f08 0%, #2d1810 100%)',
        color: '#fff'
      }}>
        Loading...
      </div>
    );
  }

  return (
    <div className="home-container">
      <Header />
      <main className="home-main">
        <div className="content-wrapper">
          <div className="main-content">
            <section className="game-section">
              <div className="section-header">
                <div>
                  <h1 className="section-title">{typeInfo.title}</h1>
                  <p style={{ 
                    color: 'rgba(255, 255, 255, 0.7)', 
                    margin: '0.5rem 0 1rem 0',
                    fontSize: '0.9rem'
                  }}>
                    {typeInfo.description}
                  </p>
                </div>
                <button 
                  className="section-arrow" 
                  onClick={() => router.push('/home')}
                  title="Back to Home"
                >
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 8L12 16L20 24" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>

              {error ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '3rem', 
                  color: '#ff6600',
                  backgroundColor: 'rgba(255, 102, 0, 0.1)',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 102, 0, 0.3)'
                }}>
                  <h3>Error Loading Games</h3>
                  <p>{error}</p>
                  <button 
                    onClick={() => fetchGames(0)}
                    style={{
                      background: '#ff6600',
                      color: 'white',
                      border: 'none',
                      padding: '0.75rem 1.5rem',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      marginTop: '1rem'
                    }}
                  >
                    Retry
                  </button>
                </div>
              ) : loading && games.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#fff' }}>
                  Loading {typeInfo.title.toLowerCase()}...
                </div>
              ) : games.length > 0 ? (
                <>
                  <div
                    className={
                      type === 'trending'
                        ? 'game-grid all-games-grid trending-grid'
                        : type === 'new'
                          ? 'game-grid all-games-grid newgame-grid'
                          : 'game-grid all-games-grid'
                    }
                  >
                    {games.map((game, index) => renderGameCard(game, index))}
                  </div>
                  
                  {type === 'all' && pagination.hasMore && (
                    <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                      <button
                        onClick={handleLoadMore}
                        disabled={loading}
                        style={{
                          background: 'linear-gradient(135deg, #ff7a2b, #e55a0b)',
                          color: 'white',
                          border: 'none',
                          padding: '0.875rem 2rem',
                          borderRadius: '8px',
                          cursor: loading ? 'not-allowed' : 'pointer',
                          fontSize: '1rem',
                          fontWeight: 600,
                          opacity: loading ? 0.6 : 1,
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {loading ? 'Loading...' : 'Load More Games'}
                      </button>
                    </div>
                  )}

                  {type === 'all' && (
                    <div style={{ 
                      textAlign: 'center', 
                      margin: '2rem 0', 
                      color: 'rgba(255, 255, 255, 0.6)',
                      fontSize: '0.9rem'
                    }}>
                      Showing {games.length} of {pagination.total} games
                    </div>
                  )}
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#fff' }}>
                  <h3>No Games Found</h3>
                  <p>There are no games available in this category yet.</p>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}