"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useProtectedRoute } from "@/lib/use-protected-route";
import Header from "@/app/components/Header";
import "./threads.css";
type ThreadComment = {
  commentId: number | null;
  replyToCommentId: number | null;
  username: string | null;
  commentText: string | null;
  createdAt: string | null;
};

type ThreadCommentNode = ThreadComment & {
  children: ThreadCommentNode[];
};

type ThreadDetail = {
  threadName: string;
  detail: string | null;
  createdAt: string | null;
  creatorUsername: string | null;
  gameName: string | null;
  gameId: number | null;
  comments: ThreadComment[];
};

export default function ThreadsPage() {
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

  const decodedThreadName = useMemo(() => {
    if (!rawParam) {
      return "";
    }
    try {
      return decodeURIComponent(rawParam);
    } catch {
      return rawParam;
    }
  }, [rawParam]);

  const [replyText, setReplyText] = useState("");
  const [notification, setNotification] = useState<{ message: string; type: string } | null>(null);
  const [thread, setThread] = useState<ThreadDetail | null>(null);
  const [isFetchingThread, setIsFetchingThread] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isPostingReply, setIsPostingReply] = useState(false);
  const [replyTarget, setReplyTarget] = useState<{ commentId: number; username: string | null } | null>(null);
  const replyInputRef = useRef<HTMLTextAreaElement | null>(null);

  const showNotification = useCallback((message: string, type: string = "info") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  useEffect(() => {
    if (!decodedThreadName) {
      setThread(null);
      setLoadError("Thread not specified");
      setIsFetchingThread(false);
      return;
    }

    const controller = new AbortController();

    const loadThread = async () => {
      try {
        setIsFetchingThread(true);
        setLoadError(null);

        const endpoint = encodeURIComponent(decodedThreadName);
        const response = await fetch(`/api/forum/threads/${endpoint}`, {
          signal: controller.signal,
        });
        const data = await response.json();

        if (!response.ok) {
          const message = data?.error || "Failed to load thread";
          setThread(null);
          setLoadError(message);
          return;
        }

        if (data.thread) {
          const normalized: ThreadDetail = {
            threadName: data.thread.threadName,
            detail: data.thread.detail ?? null,
            createdAt: data.thread.createdAt ?? null,
            creatorUsername: data.thread.creatorUsername ?? null,
              gameId: typeof data.thread.gameId === 'number' ? data.thread.gameId : data.thread.gameId ? Number(data.thread.gameId) : null,
            gameName: data.thread.gameName ?? null,
            comments: Array.isArray(data.thread.comments)
              ? data.thread.comments.map((comment: any) => ({
                  commentId: comment.commentId ?? null,
                  replyToCommentId: comment.replyToCommentId ?? null,
                  username: comment.username ?? null,
                  commentText: comment.commentText ?? null,
                  createdAt: comment.createdAt ?? null,
                }))
              : [],
          };

          setThread(normalized);
        } else {
          setThread(null);
          setLoadError("Thread not found");
        }
      } catch (error: any) {
        if (error.name === "AbortError") {
          return;
        }

        console.error("Thread load error:", error);
        setThread(null);
        setLoadError("Failed to load thread");
      } finally {
        setIsFetchingThread(false);
      }
    };

    loadThread();

    return () => {
      controller.abort();
    };
  }, [decodedThreadName]);

  const handleReply = useCallback(async () => {
    const trimmed = replyText.trim();

    if (!trimmed) {
      showNotification("Please enter a reply", "info");
      return;
    }

    if (!thread) {
      showNotification("Thread is still loading", "error");
      return;
    }

    if (isPostingReply) {
      return;
    }

    try {
      setIsPostingReply(true);

      const response = await fetch(`/api/forum/threads/${encodeURIComponent(decodedThreadName)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          commentText: trimmed,
          replyToCommentId: replyTarget?.commentId ?? null,
        }),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok || !data?.comment) {
        const message = data?.error || 'Failed to post reply';
        showNotification(message, 'error');
        return;
      }

      const newComment: ThreadComment = {
        commentId: data.comment.commentId ?? null,
        replyToCommentId: data.comment.replyToCommentId ?? null,
        username: data.comment.username ?? 'You',
        commentText: data.comment.commentText ?? trimmed,
        createdAt: data.comment.createdAt ?? new Date().toISOString(),
      };

      setThread((prev) => {
        if (!prev) {
          return prev;
        }

        return {
          ...prev,
          comments: [...prev.comments, newComment],
        };
      });

      setReplyText('');
      setReplyTarget(null);
      showNotification('Reply posted successfully!', 'success');
    } catch (error) {
      console.error('Reply submit error:', error);
      showNotification('Failed to post reply', 'error');
    } finally {
      setIsPostingReply(false);
    }
  }, [decodedThreadName, isPostingReply, replyText, showNotification, thread]);

  const formatDateTime = useCallback((value: string | null) => {
    if (!value) {
      return "Moments ago";
    }

    try {
      return new Date(value).toLocaleString();
    } catch {
      return value;
    }
  }, []);

  const threadCreatedAt = useMemo(() => formatDateTime(thread?.createdAt ?? null), [formatDateTime, thread?.createdAt]);
  const commentLookup = useMemo(() => {
    const map = new Map<number, ThreadComment>();
    thread?.comments.forEach((comment) => {
      if (typeof comment.commentId === 'number') {
        map.set(comment.commentId, comment);
      }
    });
    return map;
  }, [thread?.comments]);

  const nestedComments = useMemo(() => {
    if (!thread?.comments?.length) {
      return [] as ThreadCommentNode[];
    }

    const nodesById = new Map<number, ThreadCommentNode>();
    const nodes = thread.comments.map((comment) => {
      const node: ThreadCommentNode = {
        ...comment,
        children: [],
      };

      if (typeof comment.commentId === 'number') {
        nodesById.set(comment.commentId, node);
      }

      return node;
    });

    const roots: ThreadCommentNode[] = [];

    nodes.forEach((node) => {
      const parentId = node.replyToCommentId;
      if (typeof parentId === 'number') {
        const parentNode = nodesById.get(parentId);
        if (parentNode && parentNode !== node) {
          parentNode.children.push(node);
          return;
        }
      }
      roots.push(node);
    });

    const sortNodes = (list: ThreadCommentNode[]) => {
      list.sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return aTime - bTime;
      });
      list.forEach((child) => sortNodes(child.children));
    };

    sortNodes(roots);

    return roots;
  }, [thread?.comments]);

  const renderCommentNode = (current: ThreadCommentNode, depth = 0): React.ReactNode => {
    const key = current.commentId ?? `${current.username || 'anon'}-${current.createdAt || depth}`;
    const commentTime = formatDateTime(current.createdAt);
    const parentName = typeof current.replyToCommentId === 'number'
      ? commentLookup.get(current.replyToCommentId)?.username ?? null
      : null;
    const nodeClass = depth === 0 ? 'comment-node root' : 'comment-node';
    const indentation = depth === 0 ? undefined : { marginLeft: depth * 22 };

    return (
      <div key={key} className={nodeClass} style={indentation}>
        <article className={`thread-item small${depth > 0 ? ' child' : ''}`}>
          <img className="avatar" src="/images/placeholder.svg" alt={current.username || 'Community member'} />
          <div className="thread-body">
            <div className="thread-meta" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <strong className="username">{current.username || 'Unknown user'}</strong>
                <span className="time">{commentTime}</span>
              </div>
              {typeof current.commentId === 'number' && (
                <button
                  type="button"
                  onClick={() => handleStartReply(current)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#ff7a2b',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                  }}
                >
                  Reply
                </button>
              )}
            </div>
            {parentName && (
              <div className="muted" style={{ fontSize: '0.75rem', marginBottom: '4px' }}>
                Replying to {parentName}
              </div>
            )}
            <p className="thread-text">{current.commentText || 'No reply text available.'}</p>
          </div>
        </article>
        {current.children.length > 0 && (
          <div className="comment-children">
            {current.children.map((child) => renderCommentNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const handleStartReply = useCallback((comment: ThreadComment) => {
    if (typeof comment.commentId !== 'number') {
      return;
    }
    setReplyTarget({ commentId: comment.commentId, username: comment.username ?? null });
  }, []);

  const handleCancelReply = useCallback(() => {
    setReplyTarget(null);
  }, []);

  useEffect(() => {
    if (replyTarget && replyInputRef.current) {
      replyInputRef.current.focus();
    }
  }, [replyTarget]);

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
      <main className="threads-wrapper">
        <div className="threads-inner">
          <button
            type="button"
            onClick={() => router.push('/forum')}
            style={{
              alignSelf: 'flex-start',
              marginBottom: '16px',
              background: 'transparent',
              border: 'none',
              color: '#ff7a2b',
              cursor: 'pointer',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            ← Back to community
          </button>

          <div className="threads-card">
            {isFetchingThread ? (
              <div className="muted">Loading thread…</div>
            ) : loadError ? (
              <div style={{ color: '#fff', lineHeight: 1.5 }}>
                <strong>{loadError}</strong>
                <div style={{ marginTop: '12px' }}>
                  <button
                    type="button"
                    onClick={() => router.push('/forum')}
                    className="reply-send"
                  >
                    Go back to threads
                  </button>
                </div>
              </div>
            ) : thread ? (
              <>
                <div className="thread-header">
                  <h2 className="thread-title">{thread.threadName}</h2>
                  {thread.gameName && (
                    <div className="muted" style={{ fontSize: '0.85rem', marginTop: '6px' }}>
                      Game:{' '}
                      {thread.gameId ? (
                        <button
                          type="button"
                          className="thread-game-link"
                          onClick={() => router.push(`/games/${thread.gameId}`)}
                        >
                          {thread.gameName}
                        </button>
                      ) : (
                        thread.gameName
                      )}
                    </div>
                  )}
                  <div className="muted" style={{ fontSize: '0.75rem', marginTop: '4px' }}>
                    Thread slug: {decodedThreadName}
                  </div>
                </div>

                <div className="threads-list">
                  <article className="thread-item">
                    <img className="avatar" src="/images/placeholder.svg" alt={thread.creatorUsername || 'Thread author'} />
                    <div className="thread-body">
                      <div className="thread-meta">
                        <strong className="username">{thread.creatorUsername || 'Unknown user'}</strong>
                        <span className="dot">•</span>
                        <span className="time">{threadCreatedAt}</span>
                      </div>
                      <p className="thread-text">{thread.detail || 'No additional details shared for this thread yet.'}</p>
                    </div>
                  </article>

                  {thread.comments.length > 0 ? (
                    <>
                      <div className="thread-divider"></div>
                      {nestedComments.map((node) => renderCommentNode(node))}
                    </>
                  ) : (
                    <div className="muted" style={{ padding: '8px 0 0 0' }}>No replies yet. Be the first to comment!</div>
                  )}
                </div>

                <footer className="thread-reply">
                  <img className="avatar small" src="/images/placeholder.svg" alt="Your avatar" />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {replyTarget && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'rgba(255, 122, 43, 0.12)',
                        color: '#ffb88b',
                        borderRadius: '4px',
                        padding: '4px 8px',
                        fontSize: '0.8rem',
                      }}>
                        <span>Replying to {replyTarget.username || 'this comment'}</span>
                        <button
                          type="button"
                          onClick={handleCancelReply}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#ff7a2b',
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                    <textarea
                      ref={replyInputRef}
                      className="reply-input"
                      placeholder="Type your reply... (Shift + Enter for new line)"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          if (!isPostingReply) {
                            handleReply();
                          }
                        }
                      }}
                      aria-label="Type your reply"
                      disabled={isPostingReply}
                      rows={replyText.split('\n').length + 1}
                      style={{ resize: 'vertical', minHeight: '80px' }}
                    />
                  </div>
                  <button
                    className="reply-send"
                    onClick={handleReply}
                    disabled={isPostingReply}
                    style={isPostingReply ? { opacity: 0.7, cursor: 'wait' } : undefined}
                  >
                    {isPostingReply ? 'Posting…' : 'Reply'}
                  </button>
                </footer>
              </>
            ) : (
              <div className="muted">Thread not found.</div>
            )}
          </div>
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
          }}
        >
          {notification.message}
        </div>
      )}
    </>
  );
}
