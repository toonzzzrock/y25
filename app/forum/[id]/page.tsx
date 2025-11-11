"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useProtectedRoute } from "@/lib/use-protected-route";
import Header from "@/app/components/Header";
import "./threads.css";

interface Thread {
  id: number;
  author: string;
  avatar: string;
  timeAgo: string;
  subject: string;
  content: string;
  replies?: Reply[];
}

interface Reply {
  id: number;
  author: string;
  avatar: string;
  timeAgo: string;
  content: string;
}

// Sample data - replace with API calls
const threadData: Record<number, { gameTitle: string; threads: Thread[] }> = {
  1: {
    gameTitle: "Plants vs. Zombies",
    threads: [
      {
        id: 1,
        author: "Jessy",
        avatar: "/images/placeholder.svg",
        timeAgo: "2 hours ago",
        subject: "Is this worth it",
        content: "Hi im not the best with plant vs zombie stuff ive played many game of plant vs zombie probably like 4 years ago and i just want to know is this game worth it in 2025",
        replies: [
          {
            id: 1,
            author: "Thetank20",
            avatar: "/images/placeholder.svg",
            timeAgo: "1 hour ago",
            content: "was gonna say get this game before they probably delist it in favor of the crappy remaster but you already bought it :P",
          },
          {
            id: 2,
            author: "CCCucumber",
            avatar: "/images/placeholder.svg",
            timeAgo: "40 mins ago",
            content: "they're not gonna delist it",
          },
          {
            id: 3,
            author: "Nobody",
            avatar: "/images/placeholder.svg",
            timeAgo: "10 mins ago",
            content: "I don't think so",
          },
        ],
      },
    ],
  },
};

export default function ThreadsPage() {
  const { isLoading } = useProtectedRoute();
  const router = useRouter();
  const params = useParams();
  const hubId = parseInt(params.id as string);

  const [replyText, setReplyText] = useState("");
  const [notification, setNotification] = useState<{ message: string; type: string } | null>(null);

  const showNotification = (message: string, type: string = "info") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const data = threadData[hubId] || {
    gameTitle: "Game",
    threads: [],
  };

  const handleReply = () => {
    if (replyText.trim()) {
      showNotification("Reply posted successfully!", "success");
      setReplyText("");
    } else {
      showNotification("Please enter a reply", "info");
    }
  };

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
          {data.threads.map((thread) => (
            <div key={thread.id} className="threads-card">
              <div className="thread-header">
                <h2 className="thread-title">{data.gameTitle}</h2>
              </div>

              <div className="threads-list">
                {/* Main Thread */}
                <article className="thread-item">
                  <img className="avatar" src={thread.avatar} alt={thread.author} />
                  <div className="thread-body">
                    <div className="thread-meta">
                      <strong className="username">{thread.author}</strong>
                      <span className="dot">•</span>
                      <span className="time">{thread.timeAgo}</span>
                    </div>
                    <h3 className="thread-subject">{thread.subject}</h3>
                    <p className="thread-text">{thread.content}</p>
                  </div>
                </article>

                <div className="thread-divider"></div>

                {/* Replies */}
                {thread.replies?.map((reply) => (
                  <div key={reply.id} className="reply-container">
                    <article className="thread-item small">
                      <img className="avatar" src={reply.avatar} alt={reply.author} />
                      <div className="thread-body">
                        <div className="thread-meta">
                          <strong className="username">{reply.author}</strong>
                          <span className="time">{reply.timeAgo}</span>
                        </div>
                        <p className="thread-text">{reply.content}</p>
                      </div>
                    </article>
                    <div className="reply-arrow"></div>
                  </div>
                ))}
              </div>

              {/* Reply Input */}
              <footer className="thread-reply">
                <img className="avatar small" src="/images/placeholder.svg" alt="Your avatar" />
                <input
                  className="reply-input"
                  placeholder="Type your reply..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleReply()}
                  aria-label="Type your reply"
                />
                <button className="reply-send" onClick={handleReply}>
                  Reply
                </button>
              </footer>
            </div>
          ))}
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
