"use client";

import React, { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useProtectedRoute } from "@/lib/use-protected-route";
import { useAuth } from "@/lib/auth-context";
import Header from "@/app/components/Header";
import "./forum.css";

type ThreadSummary = {
  thread_name: string;
  detail: string | null;
  created_at: string | null;
  creator_username: string | null;
  game_id: number | null;
  game_name: string | null;
  reply_count: number;
};

type GameSuggestion = {
  id: number;
  title: string;
  description?: string | null;
};

type ThreadSearchOptions = {
  gameId?: number | null;
  gameTitle?: string | null;
};

const resolveGameImage = (rawId: number | string | null | undefined) => {
  if (rawId === null || rawId === undefined) {
    return '/images/placeholder.svg';
  }

  const numericId = typeof rawId === 'number' ? rawId : Number(rawId);
  if (!Number.isFinite(numericId) || numericId <= 0) {
    return '/images/placeholder.svg';
  }

  return `/api/games/${numericId}/profile`;
};

const normalizeThreadSummary = (forum: any): ThreadSummary => {
  const rawCreatedAt = forum.created_at;
  let createdAt: string | null = null;

  if (rawCreatedAt) {
    if (typeof rawCreatedAt === 'string') {
      createdAt = rawCreatedAt;
    } else {
      const parsed = new Date(rawCreatedAt);
      if (!Number.isNaN(parsed.getTime())) {
        createdAt = parsed.toISOString();
      }
    }
  }

  return {
    thread_name: forum.thread_name,
    detail: forum.detail ?? null,
    created_at: createdAt,
    creator_username: forum.creator_username ?? null,
    game_id: typeof forum.game_id === 'number' ? forum.game_id : forum.game_id ? Number(forum.game_id) : null,
    game_name: forum.game_name ?? null,
    reply_count: Number(forum.reply_count ?? 0),
  };
};

export default function ForumPage() {
  const { isLoading } = useProtectedRoute();
  const { user } = useAuth();
  const router = useRouter();
  const [threadQuery, setThreadQuery] = useState("");
  const [notification, setNotification] = useState<{ message: string; type: string } | null>(null);
  const [peopleQuery, setPeopleQuery] = useState("");
  const [isSearchingPeople, setIsSearchingPeople] = useState(false);
  const [peopleResults, setPeopleResults] = useState<Array<{ username: string; email: string; created_at: string }>>([]);
  const [peopleSuggestions, setPeopleSuggestions] = useState<Array<{ username: string; email: string; created_at: string }>>([]);
  const [showPeopleSuggestions, setShowPeopleSuggestions] = useState(false);
  const [hasSearchedPeople, setHasSearchedPeople] = useState(false);
  const [isSearchingThreads, setIsSearchingThreads] = useState(false);
  const [threadResults, setThreadResults] = useState<ThreadSummary[]>([]);
  const [threadSuggestions, setThreadSuggestions] = useState<ThreadSummary[]>([]);
  const [showThreadSuggestions, setShowThreadSuggestions] = useState(false);
  const [hasSearchedThreads, setHasSearchedThreads] = useState(false);
  const [allThreads, setAllThreads] = useState<ThreadSummary[]>([]);
  const [isLoadingThreads, setIsLoadingThreads] = useState(true);
  const [threadsError, setThreadsError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newThreadName, setNewThreadName] = useState("");
  const [newThreadDetail, setNewThreadDetail] = useState("");
  const [gameSearchTerm, setGameSearchTerm] = useState("");
  const [gameSuggestions, setGameSuggestions] = useState<Array<{ id: number; title: string; description?: string | null }>>([]);
  const [selectedGame, setSelectedGame] = useState<{ id: number; title: string } | null>(null);
  const [isSearchingGames, setIsSearchingGames] = useState(false);
  const [gameSearchError, setGameSearchError] = useState<string | null>(null);
  const [isCreatingThread, setIsCreatingThread] = useState(false);
  const [createThreadError, setCreateThreadError] = useState<string | null>(null);
  const [hasLoadedThreads, setHasLoadedThreads] = useState(false);
  const [threadCursor, setThreadCursor] = useState<string | null>(null);
  const [hasMoreThreads, setHasMoreThreads] = useState(false);
  const [isLoadingMoreThreads, setIsLoadingMoreThreads] = useState(false);
  const [userCreatedThreads, setUserCreatedThreads] = useState<ThreadSummary[]>([]);
  const [userCommentedThreads, setUserCommentedThreads] = useState<ThreadSummary[]>([]);
  const [isLoadingUserThreads, setIsLoadingUserThreads] = useState(false);
  const [userThreadsError, setUserThreadsError] = useState<string | null>(null);
  const [threadGameFilterTerm, setThreadGameFilterTerm] = useState("");
  const [threadGameFilterSuggestions, setThreadGameFilterSuggestions] = useState<GameSuggestion[]>([]);
  const [selectedThreadGame, setSelectedThreadGame] = useState<{ id: number; title: string } | null>(null);
  const [isSearchingThreadGames, setIsSearchingThreadGames] = useState(false);
  const [showThreadGameSuggestions, setShowThreadGameSuggestions] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const isFetchingMoreRef = useRef(false);
  const isMountedRef = useRef(false);

  const showNotification = useCallback((message: string, type: string = "info") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  const getThreadGameImage = useCallback((thread: ThreadSummary) => {
    if (thread.game_id) {
      return resolveGameImage(thread.game_id);
    }
    return '/images/placeholder.svg';
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const resetCreateThreadForm = useCallback(() => {
    setNewThreadName("");
    setNewThreadDetail("");
    setGameSearchTerm("");
    setGameSuggestions([]);
    setSelectedGame(null);
    setGameSearchError(null);
    setCreateThreadError(null);
  }, []);

  const openCreateModal = useCallback(() => {
    resetCreateThreadForm();
    setIsCreateModalOpen(true);
  }, [resetCreateThreadForm]);

  const closeCreateModal = useCallback(() => {
    setIsCreateModalOpen(false);
    setIsCreatingThread(false);
    resetCreateThreadForm();
  }, [resetCreateThreadForm]);

  const handleGameSelect = useCallback((game: { id: number; title: string; description?: string | null }) => {
    setSelectedGame({ id: game.id, title: game.title });
    setGameSearchTerm(game.title);
    setGameSuggestions([]);
    setGameSearchError(null);
  }, []);

  const handleCreateThreadSubmit = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isCreatingThread) {
      return;
    }

    const trimmedName = newThreadName.trim();
    const trimmedDetail = newThreadDetail.trim();

    if (trimmedName.length < 3) {
      setCreateThreadError('Thread name must be at least 3 characters');
      return;
    }

    if (trimmedName.length > 70) {
      setCreateThreadError('Thread name must be 70 characters or fewer');
      return;
    }

    if (!selectedGame) {
      setCreateThreadError('Please select a game from the list');
      return;
    }

    if (trimmedDetail.length > 255) {
      setCreateThreadError('Detail must be 255 characters or fewer');
      return;
    }

    setIsCreatingThread(true);
    setCreateThreadError(null);

    try {
      const response = await fetch('/api/forum/threads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          threadName: trimmedName,
          detail: trimmedDetail.length > 0 ? trimmedDetail : null,
          gameId: selectedGame.id,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data?.thread) {
        const message = data?.error || 'Failed to create thread';
        setCreateThreadError(message);
        showNotification(message, 'error');
        return;
      }

      const baseThread = normalizeThreadSummary(data.thread);
      const createdThread: ThreadSummary = {
        ...baseThread,
        created_at: baseThread.created_at ?? new Date().toISOString(),
        game_id: baseThread.game_id ?? selectedGame.id,
        game_name: baseThread.game_name ?? selectedGame.title,
      };

      setAllThreads((prev) => [createdThread, ...prev]);
      setThreadsError(null);
      setUserCreatedThreads((prev) => {
        const unique = prev.filter((thread) => thread.thread_name !== createdThread.thread_name);
        const next = [createdThread, ...unique];
        return next.slice(0, 5);
      });
      setHasLoadedThreads(true);

      const activeQuery = threadQuery.trim();
      if (activeQuery.length >= 2 && createdThread.thread_name.toLowerCase().includes(activeQuery.toLowerCase())) {
        setThreadResults((prev) => [createdThread, ...prev]);
      }

      resetCreateThreadForm();
      setIsCreateModalOpen(false);
      showNotification('Thread created successfully!', 'success');
    } catch (error) {
      console.error('Create thread error:', error);
      const message = 'Failed to create thread';
      setCreateThreadError(message);
      showNotification(message, 'error');
    } finally {
      setIsCreatingThread(false);
    }
  }, [isCreatingThread, newThreadDetail, newThreadName, resetCreateThreadForm, selectedGame, showNotification, threadQuery]);

  const renderThreadMetaRow = useCallback((thread: ThreadSummary) => {
    const parts: string[] = [];
    if (thread.creator_username) {
      parts.push(`By ${thread.creator_username}`);
    }
    if (thread.created_at) {
      const createdTime = new Date(thread.created_at).toLocaleString();
      parts.push(createdTime);
    }
    parts.push(`${thread.reply_count} repl${thread.reply_count === 1 ? 'y' : 'ies'}`);
    return parts.join(' · ');
  }, []);

  const renderThreadSummaryCard = useCallback((thread: ThreadSummary, keyPrefix: string) => {
    const cardImage = getThreadGameImage(thread);
    const metaLine = renderThreadMetaRow(thread);

    return (
      <button
        type="button"
        key={`${keyPrefix}-${thread.thread_name}`}
        onClick={() => router.push(`/forum/${encodeURIComponent(thread.thread_name)}`)}
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          padding: '0.65rem 0.85rem',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '10px',
          border: '1px solid rgba(255, 122, 43, 0.25)',
          color: '#fff',
          textAlign: 'left',
          cursor: 'pointer',
        }}
      >
        <img
          src={cardImage}
          alt={thread.game_name || 'Thread game'}
          style={{ width: 56, height: 56, borderRadius: '12px', objectFit: 'cover', flexShrink: 0 }}
          onError={(event) => {
            (event.target as HTMLImageElement).src = '/images/placeholder.svg';
          }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', flex: 1 }}>
          <strong style={{ fontSize: '1rem', color: '#fff' }}>{thread.thread_name}</strong>
          <span className="muted" style={{ fontSize: '0.8rem' }}>{thread.detail || 'No description yet'}</span>
          {thread.game_name && (
            <span className="muted" style={{ fontSize: '0.75rem' }}>
              Game:{' '}
              {thread.game_id ? (
                <span
                  role="link"
                  tabIndex={0}
                  className="thread-game-link"
                  onClick={(event) => {
                    event.stopPropagation();
                    router.push(`/games/${thread.game_id}`);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      event.stopPropagation();
                      router.push(`/games/${thread.game_id}`);
                    }
                  }}
                >
                  {thread.game_name}
                </span>
              ) : (
                thread.game_name
              )}
            </span>
          )}
          <span style={{ fontSize: '0.75rem', color: '#ffb88b' }}>{metaLine}</span>
        </div>
      </button>
    );
  }, [getThreadGameImage, renderThreadMetaRow, router]);

  const renderUserThreadCard = useCallback((thread: ThreadSummary, keyPrefix: string) => {
    const cardImage = getThreadGameImage(thread);
    const metaLine = renderThreadMetaRow(thread);

    return (
      <button
        key={`${keyPrefix}-${thread.thread_name}`}
        type="button"
        className="record-card"
        onClick={() => router.push(`/forum/${encodeURIComponent(thread.thread_name)}`)}
        style={{
          width: '100%',
          border: 'none',
          background: '#2b1f1d',
          textAlign: 'left',
          color: '#fff',
          cursor: 'pointer',
        }}
      >
        <img
          src={cardImage}
          alt={thread.game_name || thread.thread_name}
          onError={(event) => {
            (event.target as HTMLImageElement).src = '/images/placeholder.svg';
          }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', flex: 1 }}>
          <strong>{thread.thread_name}</strong>
          {thread.detail && (
            <div className="muted" style={{ fontSize: '0.75rem', lineHeight: 1.3 }}>{thread.detail}</div>
          )}
          {thread.game_name && (
            <div className="muted" style={{ fontSize: '0.75rem' }}>
              Game:{' '}
              {thread.game_id ? (
                <span
                  role="link"
                  tabIndex={0}
                  className="thread-game-link"
                  onClick={(event) => {
                    event.stopPropagation();
                    router.push(`/games/${thread.game_id}`);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      event.stopPropagation();
                      router.push(`/games/${thread.game_id}`);
                    }
                  }}
                >
                  {thread.game_name}
                </span>
              ) : (
                thread.game_name
              )}
            </div>
          )}
          <span style={{ fontSize: '0.75rem', color: '#ffb88b' }}>{metaLine}</span>
        </div>
      </button>
    );
  }, [getThreadGameImage, renderThreadMetaRow, router]);

  const fetchThreads = useCallback(async ({ cursor = null, append = false }: { cursor?: string | null; append?: boolean } = {}) => {
    const isAppending = Boolean(append);

    if (isAppending) {
      if (isFetchingMoreRef.current) {
        return;
      }

      isFetchingMoreRef.current = true;
      setIsLoadingMoreThreads(true);
    } else {
      setIsLoadingThreads(true);
      setThreadsError(null);
      setHasLoadedThreads(false);
    }

    try {
      console.log('[forum] fetchThreads:start', { cursor, append: isAppending });
      const params = new URLSearchParams({ limit: '15' });
      if (cursor) {
        params.set('cursor', cursor);
      }

      const response = await fetch(`/api/forum/threads?${params.toString()}`);
      const data = await response.json();

      console.log('[forum] fetchThreads:response', {
        status: response.status,
        ok: response.ok,
        rawThreads: Array.isArray(data.threads) ? data.threads.length : null,
        hasMore: data.hasMore,
        nextCursor: data.nextCursor,
      });

      if (!response.ok) {
        throw new Error(data?.error || 'Failed to load threads');
      }

      const normalized: ThreadSummary[] = Array.isArray(data.threads)
        ? (data.threads as any[]).map(normalizeThreadSummary)
        : [];

      if (isMountedRef.current) {
        if (isAppending) {
          setAllThreads((prev) => {
            const seen = new Set(prev.map((thread) => thread.thread_name));
            const next = [...prev];
            normalized.forEach((thread) => {
              if (!seen.has(thread.thread_name)) {
                seen.add(thread.thread_name);
                next.push(thread);
              }
            });
            return next;
          });
        } else {
          setAllThreads(normalized);
        }

        if (!isAppending) {
          setThreadsError(normalized.length === 0 ? 'No threads available yet' : null);
          setHasLoadedThreads(true);
        }

        setHasMoreThreads(Boolean(data.hasMore));

        const nextCursorRaw = typeof data.nextCursor === 'string' ? data.nextCursor : null;
        setThreadCursor(nextCursorRaw && nextCursorRaw.length > 0 ? nextCursorRaw : null);
      }
    } catch (error: any) {
      console.error('[forum] fetchThreads:error', error);
      const message = error?.message || 'Failed to load threads';

      if (isMountedRef.current) {
        if (!append) {
          setThreadsError(message);
          setHasLoadedThreads(true);
        }
        showNotification(message, 'error');
      }
    } finally {
      if (isMountedRef.current) {
        if (isAppending) {
          isFetchingMoreRef.current = false;
          setIsLoadingMoreThreads(false);
        } else {
          setIsLoadingThreads(false);
        }
      } else {
        isFetchingMoreRef.current = false;
      }

      console.log('[forum] fetchThreads:complete', {
        append: isAppending,
        isMounted: isMountedRef.current,
      });
    }
  }, [showNotification]);

  const handleGameSearchChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setGameSearchTerm(value);
    setGameSuggestions([]);
    setGameSearchError(null);

    if (selectedGame && value.trim().toLowerCase() !== selectedGame.title.toLowerCase()) {
      setSelectedGame(null);
    }
  }, [selectedGame]);

  const searchThreads = useCallback(async (value?: string, options?: ThreadSearchOptions) => {
    const queryToUse = value ?? threadQuery;
    const trimmed = queryToUse.trim();
    const hasOverrideGameId = options && Object.prototype.hasOwnProperty.call(options, 'gameId');
    const hasOverrideGameTitle = options && Object.prototype.hasOwnProperty.call(options, 'gameTitle');
    const activeGameId = hasOverrideGameId ? (options?.gameId ?? null) : selectedThreadGame?.id ?? null;
    const activeGameTitle = hasOverrideGameTitle ? (options?.gameTitle ?? null) : selectedThreadGame?.title ?? null;

    if (trimmed.length < 2 && !activeGameId) {
      showNotification("Enter at least 2 characters or choose a game to filter threads", "info");
      setThreadResults([]);
      setThreadSuggestions([]);
      setShowThreadSuggestions(false);
      setHasSearchedThreads(false);
      return;
    }

    const params = new URLSearchParams();
    if (trimmed.length >= 2) {
      params.set('q', trimmed);
    }
    if (activeGameId) {
      params.set('gameId', String(activeGameId));
    }

    setIsSearchingThreads(true);
    setShowThreadSuggestions(false);
    setThreadSuggestions([]);
  setShowThreadGameSuggestions(false);
    try {
      const response = await fetch(`/api/forum/search?${params.toString()}`);
      const data = await response.json();

      if (response.ok && Array.isArray(data.forums)) {
        const normalized: ThreadSummary[] = (data.forums as any[]).map(normalizeThreadSummary);

        setThreadResults(normalized);
        setHasSearchedThreads(true);
        const count = normalized.length;
        const plural = count === 1 ? "" : "s";
        const suffix = activeGameTitle ? ` for ${activeGameTitle}` : "";
        showNotification(`Found ${count} thread${plural}${suffix}`, count > 0 ? "success" : "info");
      } else {
        setThreadResults([]);
        setHasSearchedThreads(true);
        const baseMessage = data.error || "No threads found";
        showNotification(`${baseMessage}${activeGameTitle ? ` for ${activeGameTitle}` : ""}`, "info");
      }
    } catch (error) {
      console.error('Thread search error:', error);
      showNotification("Failed to search threads", "error");
      setThreadResults([]);
      setHasSearchedThreads(false);
    } finally {
      setIsSearchingThreads(false);
    }
  }, [selectedThreadGame, showNotification, threadQuery]);

  const searchPeople = useCallback(async (value?: string) => {
    const queryToUse = value ?? peopleQuery;
    const trimmed = queryToUse.trim();

    if (trimmed.length < 2) {
      showNotification("Enter at least 2 characters to find people", "info");
      setPeopleResults([]);
      setPeopleSuggestions([]);
      setShowPeopleSuggestions(false);
      setHasSearchedPeople(false);
      return;
    }

    setIsSearchingPeople(true);
    setShowPeopleSuggestions(false);
    setPeopleSuggestions([]);
    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(trimmed)}`);
      const data = await response.json();

      if (response.ok && Array.isArray(data.users)) {
        setPeopleResults(data.users);
        setHasSearchedPeople(true);
        const count = data.users.length;
        const plural = count === 1 ? "" : "s";
        showNotification(`Found ${count} user${plural}`, count > 0 ? "success" : "info");
      } else {
        setPeopleResults([]);
        setHasSearchedPeople(true);
        showNotification(data.error || "No users found", "info");
      }
    } catch (error) {
      console.error('People search error:', error);
      showNotification("Failed to search users", "error");
      setPeopleResults([]);
      setHasSearchedPeople(false);
    } finally {
      setIsSearchingPeople(false);
    }
  }, [peopleQuery, showNotification]);

  useEffect(() => {
    const trimmed = threadQuery.trim();

    if (isSearchingThreads || hasSearchedThreads) {
      setShowThreadSuggestions(false);
      return;
    }

    if (trimmed.length < 2) {
      setThreadSuggestions([]);
      setShowThreadSuggestions(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/forum/search?q=${encodeURIComponent(trimmed)}&limit=5`, {
          signal: controller.signal,
        });
        const data = await response.json();

        if (response.ok && Array.isArray(data.forums) && trimmed === threadQuery.trim()) {
          const normalized: ThreadSummary[] = (data.forums as any[])
            .slice(0, 5)
            .map(normalizeThreadSummary);

          setThreadSuggestions(normalized);
          setShowThreadSuggestions(true);
        } else {
          setThreadSuggestions([]);
          setShowThreadSuggestions(false);
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
          return;
        }
        console.error('Thread suggestion error:', error);
        setThreadSuggestions([]);
        setShowThreadSuggestions(false);
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [threadQuery, hasSearchedThreads, isSearchingThreads]);

  useEffect(() => {
    const trimmed = peopleQuery.trim();

    if (isSearchingPeople || hasSearchedPeople) {
      setShowPeopleSuggestions(false);
      return;
    }

    if (trimmed.length < 2) {
      setPeopleSuggestions([]);
      setShowPeopleSuggestions(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/users/search?q=${encodeURIComponent(trimmed)}&limit=5`, {
          signal: controller.signal,
        });
        const data = await response.json();

        if (response.ok && Array.isArray(data.users) && trimmed === peopleQuery.trim()) {
          setPeopleSuggestions(data.users.slice(0, 5));
          setShowPeopleSuggestions(true);
        } else {
          setPeopleSuggestions([]);
          setShowPeopleSuggestions(false);
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
          return;
        }
        console.error('People suggestion error:', error);
        setPeopleSuggestions([]);
        setShowPeopleSuggestions(false);
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [peopleQuery, hasSearchedPeople, isSearchingPeople]);

  useEffect(() => {
    if (!isCreateModalOpen) {
      setGameSuggestions([]);
      setIsSearchingGames(false);
      return;
    }

    const term = gameSearchTerm.trim();

    if (term.length < 2) {
      setGameSuggestions([]);
      setGameSearchError(null);
      return;
    }

    if (selectedGame && term.toLowerCase() === selectedGame.title.toLowerCase()) {
      setGameSuggestions([]);
      setGameSearchError(null);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        setIsSearchingGames(true);
        const response = await fetch(`/api/games/search?q=${encodeURIComponent(term)}`, {
          signal: controller.signal,
        });
        const data = await response.json();

        if (response.ok && Array.isArray(data.games)) {
          const normalized = (data.games as any[]).map((game) => ({
            id: typeof game.id === 'number' ? game.id : Number(game.id),
            title: game.title,
            description: game.description ?? null,
          })).filter((game) => Number.isFinite(game.id));

          setGameSuggestions(normalized.slice(0, 8));
          setGameSearchError(normalized.length === 0 ? 'No games found' : null);
        } else {
          setGameSuggestions([]);
          setGameSearchError(data.error || 'No games found');
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
          return;
        }
        console.error('Game search error:', error);
        setGameSuggestions([]);
        setGameSearchError('Failed to search games');
      } finally {
        setIsSearchingGames(false);
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [gameSearchTerm, isCreateModalOpen, selectedGame]);

  const trimmedThreadQuery = threadQuery.trim();
  const showGeneralFeed = trimmedThreadQuery.length < 2 && !hasSearchedThreads;
  const showSearchResults = hasSearchedThreads || isSearchingThreads;
  const showThreadsFeed = showGeneralFeed || showSearchResults;
  const filteredFeedTitle = selectedThreadGame && trimmedThreadQuery.length >= 2
    ? `Results for "${trimmedThreadQuery}" in ${selectedThreadGame.title}`
    : selectedThreadGame
      ? `Threads for ${selectedThreadGame.title}`
      : trimmedThreadQuery.length >= 2
        ? `Results for "${trimmedThreadQuery}"`
        : 'Search Results';

  useEffect(() => {
    const node = loadMoreRef.current;

    if (!node || !showGeneralFeed || !hasMoreThreads || !threadCursor) {
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          fetchThreads({ cursor: threadCursor, append: true });
        }
      });
    }, { rootMargin: '200px 0px' });

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [fetchThreads, hasMoreThreads, showGeneralFeed, threadCursor]);

  const handleThreadSuggestionClick = useCallback((threadName: string) => {
    setThreadQuery(threadName);
    setShowThreadSuggestions(false);
    setThreadSuggestions([]);
    searchThreads(threadName);
  }, [searchThreads]);

  const handleSuggestionClick = useCallback((username: string) => {
    setPeopleQuery(username);
    setShowPeopleSuggestions(false);
    setPeopleSuggestions([]);
    searchPeople(username);
  }, [searchPeople]);

  const handleThreadGameFilterChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setThreadGameFilterTerm(value);

    if (selectedThreadGame && value.trim().toLowerCase() !== selectedThreadGame.title.toLowerCase()) {
      setSelectedThreadGame(null);
    }

    if (value.trim().length < 2) {
      setThreadGameFilterSuggestions([]);
      setShowThreadGameSuggestions(false);
    } else {
      setShowThreadGameSuggestions(true);
    }
  }, [selectedThreadGame]);

  const handleThreadGameSelect = useCallback((game: GameSuggestion) => {
    setSelectedThreadGame({ id: game.id, title: game.title });
    setThreadGameFilterTerm(game.title);
    setThreadGameFilterSuggestions([]);
    setShowThreadGameSuggestions(false);
    void searchThreads(undefined, { gameId: game.id, gameTitle: game.title });
  }, [searchThreads]);

  const clearThreadGameFilter = useCallback(() => {
    setSelectedThreadGame(null);
    setThreadGameFilterTerm("");
    setThreadGameFilterSuggestions([]);
    setShowThreadGameSuggestions(false);
    const trimmedQuery = threadQuery.trim();

    if (trimmedQuery.length >= 2) {
      void searchThreads(trimmedQuery, { gameId: null, gameTitle: null });
    } else {
      setThreadResults([]);
      setHasSearchedThreads(false);
    }
  }, [searchThreads, threadQuery]);

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  useEffect(() => {
    const term = threadGameFilterTerm.trim();

    if (!term) {
      setThreadGameFilterSuggestions([]);
      setIsSearchingThreadGames(false);
      return;
    }

    if (term.length < 2) {
      setThreadGameFilterSuggestions([]);
      setIsSearchingThreadGames(false);
      return;
    }

  const controller = new AbortController();
  setIsSearchingThreadGames(true);

  const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/games/search?q=${encodeURIComponent(term)}`, {
          signal: controller.signal,
        });
        const data = await response.json();

        if (response.ok && Array.isArray(data.games)) {
          const normalized: GameSuggestion[] = (data.games as any[])
            .map((game) => ({
              id: typeof game.id === 'number' ? game.id : Number(game.id),
              title: game.title ?? game.game_name ?? 'Unknown game',
              description: game.description ?? game.detail ?? null,
            }))
            .filter((game) => Number.isFinite(game.id));

          setThreadGameFilterSuggestions(normalized.slice(0, 8));
          setShowThreadGameSuggestions(true);
        } else {
          setThreadGameFilterSuggestions([]);
        }
      } catch (error) {
        if ((error as any)?.name === 'AbortError') {
          return;
        }
        console.error('Thread filter game search error:', error);
        setThreadGameFilterSuggestions([]);
      } finally {
        setIsSearchingThreadGames(false);
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [threadGameFilterTerm]);

  useEffect(() => {
    if (!user?.username) {
      setUserCreatedThreads([]);
      setUserCommentedThreads([]);
      setUserThreadsError(null);
      setIsLoadingUserThreads(false);
      return;
    }

    let cancelled = false;

    const loadUserThreads = async () => {
      setIsLoadingUserThreads(true);
      setUserThreadsError(null);

      try {
        const response = await fetch('/api/forum/user-threads', {
          credentials: 'include',
        });
        const data = await response.json();

        if (cancelled) {
          return;
        }

        if (response.ok) {
          const created = Array.isArray(data.createdThreads)
            ? (data.createdThreads as any[]).map(normalizeThreadSummary)
            : [];
          const commented = Array.isArray(data.commentedThreads)
            ? (data.commentedThreads as any[]).map(normalizeThreadSummary)
            : [];

          setUserCreatedThreads(created);
          setUserCommentedThreads(commented);
        } else {
          const message = data?.error || 'Failed to load your threads';
          setUserThreadsError(message);
          setUserCreatedThreads([]);
          setUserCommentedThreads([]);
        }
      } catch (error) {
        console.error('User threads fetch error:', error);
        if (!cancelled) {
          setUserThreadsError('Failed to load your threads');
          setUserCreatedThreads([]);
          setUserCommentedThreads([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingUserThreads(false);
        }
      }
    };

    loadUserThreads();

    return () => {
      cancelled = true;
    };
  }, [user?.username]);

  const recentThreads = useMemo(() => allThreads.slice(0, 5), [allThreads]);
  const mostDiscussedThreads = useMemo(() => (
    [...allThreads]
      .sort((a, b) => b.reply_count - a.reply_count)
      .slice(0, 5)
  ), [allThreads]);
  const filteredCommentedThreads = useMemo(() => {
    if (userCommentedThreads.length === 0) {
      return [] as ThreadSummary[];
    }

    const createdNames = new Set(userCreatedThreads.map((thread) => thread.thread_name));
    return userCommentedThreads.filter((thread) => !createdNames.has(thread.thread_name));
  }, [userCommentedThreads, userCreatedThreads]);
  const hasThreadData = allThreads.length > 0;
  const showSidebarLoading = !hasLoadedThreads && isLoadingThreads;
  const showFeedLoading = !hasLoadedThreads && isLoadingThreads && !hasThreadData;

  useEffect(() => {
    console.log('[forum] load state change', {
      hasLoadedThreads,
      isLoadingThreads,
      threadCount: allThreads.length,
      hasMoreThreads,
      showSidebarLoading,
      showFeedLoading,
    });
  }, [hasLoadedThreads, isLoadingThreads, allThreads.length, hasMoreThreads, showSidebarLoading, showFeedLoading]);

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        color: '#fff',
        fontSize: '1.2rem',
      }}>
        Loading...
      </div>
    );
  }

  return (
    <>
      <Header showSearch={false} />
      <main className="forum-container">
        <h1 className="page-title">Community Activity</h1>
        <p className="page-sub">Community and official content for all games and software on Y25.</p>

        <div className="community-grid">
          <div className="left-column">
            <div className="hubs-row">
              <div className="hub-card">
                <h3 style={{ color: '#ff7a2b', margin: '0 0 10px 0' }}>LATEST THREADS</h3>
                {showSidebarLoading ? (
                  <div className="muted">Loading threads…</div>
                ) : threadsError ? (
                  <div className="muted">{threadsError}</div>
                ) : recentThreads.length > 0 ? (
                  recentThreads.map((thread) => renderUserThreadCard(thread, 'latest-thread'))
                ) : (
                  <div className="muted">No threads yet.</div>
                )}
              </div>

              <div className="hub-card">
                <h3 style={{ color: '#ff7a2b', margin: '0 0 10px 0' }}>MOST DISCUSSED</h3>
                {showSidebarLoading ? (
                  <div className="muted">Loading threads…</div>
                ) : threadsError ? (
                  <div className="muted">{threadsError}</div>
                ) : mostDiscussedThreads.length > 0 ? (
                  mostDiscussedThreads.map((thread) => renderUserThreadCard(thread, 'top-thread'))
                ) : (
                  <div className="muted">No activity yet.</div>
                )}
              </div>
            </div>

            <div className="create-thread-footer">
              <button
                type="button"
                className="create-thread-button"
                onClick={openCreateModal}
              >
                + Create New Thread
              </button>
              <p className="create-thread-hint">Pick a game and start a fresh conversation.</p>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="sidebar">
            <div style={{ marginTop: '8px' }}>
              <label style={{ color: '#ff7a2b', fontWeight: '600' }}>FIND PEOPLE</label>
              <div className="search-small">
                <input
                  placeholder="Find people..."
                  value={peopleQuery}
                  onChange={(event) => {
                    const { value } = event.target;
                    setPeopleQuery(value);
                    setHasSearchedPeople(false);

                    if (!value.trim()) {
                      setPeopleResults([]);
                      setPeopleSuggestions([]);
                      setShowPeopleSuggestions(false);
                      setHasSearchedPeople(false);
                    }
                  }}
                  onFocus={() => {
                    if (peopleSuggestions.length > 0) {
                      setShowPeopleSuggestions(true);
                    }
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      searchPeople();
                    }
                  }}
                />
                <button
                  className="small-ghost"
                  onClick={() => searchPeople()}
                  disabled={isSearchingPeople}
                  style={isSearchingPeople ? { opacity: 0.6, cursor: 'wait' } : undefined}
                >
                  {isSearchingPeople ? '…' : '🔍'}
                </button>
              </div>
              {(peopleQuery.trim() || hasSearchedPeople) && (
                <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {showPeopleSuggestions && peopleSuggestions.length > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.35rem',
                        background: 'rgba(255, 255, 255, 0.04)',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 122, 43, 0.25)',
                        padding: '0.5rem 0.6rem',
                        boxShadow: '0 6px 12px rgba(0, 0, 0, 0.25)',
                      }}
                    >
                      {peopleSuggestions.map((suggestion) => (
                        <button
                          key={`suggestion-${suggestion.username}`}
                          type="button"
                          onClick={() => handleSuggestionClick(suggestion.username)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            textAlign: 'left',
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            padding: '0.35rem 0.25rem',
                            borderRadius: '6px',
                          }}
                        >
                          <div style={{ fontWeight: 600 }}>{suggestion.username}</div>
                          <div className="muted" style={{ fontSize: '0.75rem' }}>{suggestion.email}</div>
                        </button>
                      ))}
                    </div>
                  )}

                  {hasSearchedPeople && (
                    isSearchingPeople ? (
                      <div className="muted">Searching users...</div>
                    ) : peopleResults.length > 0 ? (
                      peopleResults.map((user) => {
                        const joinedDate = user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Recently joined';
                        return (
                          <div
                            key={user.username}
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              padding: '0.5rem 0.75rem',
                              background: 'rgba(255, 255, 255, 0.05)',
                              borderRadius: '8px',
                              border: '1px solid rgba(255, 122, 43, 0.3)',
                              color: '#fff',
                              gap: '0.25rem',
                            }}
                          >
                            <strong style={{ fontSize: '0.95rem' }}>{user.username}</strong>
                            <span className="muted" style={{ fontSize: '0.8rem' }}>{user.email}</span>
                            <span style={{ fontSize: '0.75rem', color: '#ff7a2b' }}>
                              Joined {joinedDate}
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <div className="muted">No users match this search.</div>
                    )
                  )}
                </div>
              )}
            </div>

            <hr className="sep" />

            <div style={{ marginTop: '16px' }}>
              <h3 style={{ margin: '0 0 12px 0', color: '#fff' }}>Your Forum Activity</h3>
              {isLoadingUserThreads ? (
                <div className="muted">Loading your threads…</div>
              ) : userThreadsError ? (
                <div className="muted">{userThreadsError}</div>
              ) : (
                <>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: '6px', color: '#ff7a2b' }}>Threads you created</div>
                    {userCreatedThreads.length > 0 ? (
                      userCreatedThreads.map((thread) => renderUserThreadCard(thread, 'created'))
                    ) : (
                      <div className="muted">No threads created yet.</div>
                    )}
                  </div>

                  <div style={{ marginTop: '12px' }}>
                    <div style={{ fontWeight: 600, marginBottom: '6px', color: '#ff7a2b' }}>Threads you commented on</div>
                    {filteredCommentedThreads.length > 0 ? (
                      filteredCommentedThreads.map((thread) => renderUserThreadCard(thread, 'commented'))
                    ) : (
                      <div className="muted">No comments yet.</div>
                    )}
                  </div>
                </>
              )}
            </div>

          </aside>
        </div>

        <section className="threads-discovery">
          <div className="threads-search-header">
            <div>
              <h2>Explore Threads</h2>
              <p>Search our community or keep scrolling to discover more conversations.</p>
            </div>
          </div>

          <div className="threads-search-area">
            <div className="search-small" style={{ marginBottom: 0 }}>
              <input
                placeholder="Find threads..."
                value={threadQuery}
                onChange={(event) => {
                  const { value } = event.target;
                  setThreadQuery(value);
                  setHasSearchedThreads(false);

                  if (!value.trim()) {
                    setThreadResults([]);
                    setThreadSuggestions([]);
                    setShowThreadSuggestions(false);
                  }
                }}
                onFocus={() => {
                  if (threadSuggestions.length > 0) {
                    setShowThreadSuggestions(true);
                  }
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    searchThreads();
                  }
                }}
              />
              <button
                className="small-ghost"
                onClick={() => searchThreads()}
                disabled={isSearchingThreads}
                style={isSearchingThreads ? { opacity: 0.6, cursor: 'wait' } : undefined}
              >
                {isSearchingThreads ? '…' : '🔍'}
              </button>
            </div>

            {showThreadSuggestions && threadSuggestions.length > 0 && (
              <div className="thread-suggestions">
                {threadSuggestions.map((suggestion) => (
                  <button
                    key={`thread-suggestion-${suggestion.thread_name}`}
                    type="button"
                    onClick={() => handleThreadSuggestionClick(suggestion.thread_name)}
                    className="thread-suggestion-item"
                  >
                    <div style={{ fontWeight: 600 }}>{suggestion.thread_name}</div>
                    <div className="muted" style={{ fontSize: '0.75rem' }}>{suggestion.detail || 'No description yet'}</div>
                  </button>
                ))}
              </div>
            )}

            <div className="search-small" style={{ marginTop: '0.75rem' }}>
              <input
                placeholder="Filter by game..."
                value={threadGameFilterTerm}
                onChange={handleThreadGameFilterChange}
                onFocus={() => {
                  if (threadGameFilterSuggestions.length > 0) {
                    setShowThreadGameSuggestions(true);
                  }
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    searchThreads();
                  }
                }}
              />
              <button
                className="small-ghost"
                onClick={clearThreadGameFilter}
                disabled={!threadGameFilterTerm.trim() && !selectedThreadGame}
                style={!threadGameFilterTerm.trim() && !selectedThreadGame ? { opacity: 0.6, cursor: 'not-allowed' } : undefined}
              >
                {selectedThreadGame || threadGameFilterTerm.trim() ? '✕' : '🎮'}
              </button>
            </div>

            {isSearchingThreadGames && (
              <div className="muted" style={{ marginTop: '0.5rem' }}>Searching games…</div>
            )}

            {showThreadGameSuggestions && threadGameFilterSuggestions.length > 0 && (
              <div className="thread-suggestions">
                {threadGameFilterSuggestions.map((game) => (
                  <button
                    key={`thread-game-suggestion-${game.id}`}
                    type="button"
                    onClick={() => handleThreadGameSelect(game)}
                    className="thread-suggestion-item"
                  >
                    <div style={{ fontWeight: 600 }}>{game.title}</div>
                    {game.description && (
                      <div className="muted" style={{ fontSize: '0.75rem' }}>{game.description}</div>
                    )}
                  </button>
                ))}
              </div>
            )}

            {!isSearchingThreadGames && threadGameFilterTerm.trim().length > 0 && threadGameFilterTerm.trim().length < 2 && (
              <div className="muted" style={{ marginTop: '0.5rem' }}>Enter at least 2 characters to search games.</div>
            )}

            {selectedThreadGame && (
              <div className="muted" style={{ marginTop: '0.5rem' }}>
                Filtering threads for <strong style={{ color: '#ffb88b' }}>{selectedThreadGame.title}</strong>
              </div>
            )}

            {trimmedThreadQuery.length > 0 && trimmedThreadQuery.length < 2 && !selectedThreadGame && (
              <div className="muted" style={{ marginTop: '0.5rem' }}>Enter at least 2 characters to search threads or pick a game filter.</div>
            )}
          </div>

          {showThreadsFeed && (
            <div className="threads-feed">
              <h3>{showGeneralFeed ? 'All Threads' : filteredFeedTitle}</h3>
              {showGeneralFeed ? (
                threadsError ? (
                  <div className="muted">{threadsError}</div>
                ) : showFeedLoading ? (
                  <div className="muted">Loading threads...</div>
                ) : allThreads.length > 0 ? (
                  <div className="threads-feed-list">
                    {allThreads.map((thread) => renderThreadSummaryCard(thread, 'feed-thread'))}
                  </div>
                ) : (
                  <div className="muted">No threads yet.</div>
                )
              ) : isSearchingThreads ? (
                <div className="muted">Searching threads...</div>
              ) : threadResults.length > 0 ? (
                <div className="threads-feed-list">
                  {threadResults.map((thread) => renderThreadSummaryCard(thread, 'search-result'))}
                </div>
              ) : (
                <div className="muted">No threads match this search.</div>
              )}

              {showGeneralFeed && (
                <>
                  <div ref={loadMoreRef} className="threads-feed-sentinel" aria-hidden="true" />
                  {isLoadingMoreThreads && <div className="muted">Loading more threads...</div>}
                  {!threadsError && !isLoadingThreads && !isLoadingMoreThreads && !hasMoreThreads && allThreads.length > 0 && (
                    <div className="muted">You have reached the end.</div>
                  )}
                </>
              )}
            </div>
          )}
        </section>
      </main>

      {isCreateModalOpen && (
        <div className="forum-modal-overlay" onClick={closeCreateModal}>
          <div
            className="forum-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-thread-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="forum-modal-close"
              aria-label="Close"
              onClick={closeCreateModal}
              disabled={isCreatingThread}
            >
              X
            </button>
            <h2 id="create-thread-title">Create a New Thread</h2>
            <p className="forum-modal-subtitle">Threads stay healthier when they begin with a clear focus and real game.</p>

            <form className="forum-modal-form" onSubmit={handleCreateThreadSubmit}>
              <label className="forum-modal-label" htmlFor="thread-name-input">Thread name</label>
              <input
                id="thread-name-input"
                className="forum-modal-input"
                value={newThreadName}
                onChange={(event) => setNewThreadName(event.target.value)}
                placeholder="e.g. Tips for clearing Stage 10"
                maxLength={70}
                autoFocus
                disabled={isCreatingThread}
              />

              <label className="forum-modal-label" htmlFor="thread-detail-input">Details (optional)</label>
              <textarea
                id="thread-detail-input"
                className="forum-modal-textarea"
                value={newThreadDetail}
                onChange={(event) => setNewThreadDetail(event.target.value)}
                placeholder="Share extra context or rules for the discussion"
                maxLength={255}
                rows={3}
                disabled={isCreatingThread}
              />

              <label className="forum-modal-label" htmlFor="game-search-input">Game</label>
              <input
                id="game-search-input"
                className="forum-modal-input"
                value={gameSearchTerm}
                onChange={handleGameSearchChange}
                placeholder="Start typing to find a game..."
                autoComplete="off"
                disabled={isCreatingThread}
              />

              {selectedGame && (
                <div className="selected-game-chip">
                  <span>Selected: {selectedGame.title}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedGame(null)}
                    disabled={isCreatingThread}
                    aria-label="Remove selected game"
                  >
                    X
                  </button>
                </div>
              )}

              {isSearchingGames && <div className="muted">Searching games…</div>}
              {gameSearchError && <div className="error-text">{gameSearchError}</div>}

              {gameSuggestions.length > 0 && (
                <div className="forum-modal-suggestions">
                  {gameSuggestions.map((game) => (
                    <button
                      type="button"
                      key={`game-suggestion-${game.id}`}
                      className="forum-modal-suggestion"
                      onClick={() => handleGameSelect(game)}
                      disabled={isCreatingThread}
                    >
                      <strong>{game.title}</strong>
                      <span>{game.description || 'No description available'}</span>
                    </button>
                  ))}
                </div>
              )}

              {createThreadError && <div className="error-text">{createThreadError}</div>}

              <div className="forum-modal-actions">
                <button
                  type="button"
                  className="modal-secondary"
                  onClick={closeCreateModal}
                  disabled={isCreatingThread}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="modal-primary"
                  disabled={isCreatingThread}
                >
                  {isCreatingThread ? 'Creating…' : 'Create thread'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
          }}
        >
          {notification.message}
        </div>
      )}
    </>
  );
}
