"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useProtectedRoute } from "@/lib/use-protected-route";
import Header from "@/app/components/Header";
import "./forum.css";

export default function ForumPage() {
  const { isLoading } = useProtectedRoute();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [notification, setNotification] = useState<{ message: string; type: string } | null>(null);

  const showNotification = (message: string, type: string = "info") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Sample hub data - replace with actual data from API
  const recentlyViewedHubs = [
    { id: 1, name: "Hungry Shark", stats: "288 new screenshots", image: "/images/placeholder.svg" },
  ];

  const popularHubs = [
    { id: 1, name: "Bad Ice-cream", stats: "330 new artwork this week", image: "/images/placeholder.svg" },
    { id: 2, name: "Fruit Ninja", stats: "555 new screenshots", image: "/images/placeholder.svg" },
    { id: 3, name: "Plants vs. Zombies", stats: "144 new screenshots", image: "/images/placeholder.svg" },
  ];

  const badges = [
    { id: 1, title: "King of fruit slicing", image: "/images/placeholder.svg" },
  ];

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
              {/* Recently Viewed Hubs */}
              <div className="hub-card">
                <h3 style={{ color: '#ff7a2b', margin: '0 0 10px 0' }}>YOUR RECENTLY VIEWED HUBS</h3>
                {recentlyViewedHubs.map((hub) => (
                  <div key={hub.id} className="hub-item" onClick={() => router.push(`/forum/${hub.id}`)}>
                    <img src={hub.image} alt={hub.name} />
                    <div>
                      <strong>{hub.name}</strong>
                      <div className="muted">{hub.stats}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Popular Hubs */}
              <div className="hub-card">
                <h3 style={{ color: '#ff7a2b', margin: '0 0 10px 0' }}>POPULAR HUBS</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {popularHubs.map((hub) => (
                    <div 
                      key={hub.id} 
                      className="hub-item" 
                      onClick={() => router.push(`/forum/${hub.id}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      <img src={hub.image} alt={hub.name} />
                      <div>
                        <strong>{hub.name}</strong>
                        <div className="muted">{hub.stats}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Featured */}
            <div className="feature">
              <img src="/images/placeholder.svg" alt="Featured" />
              <div style={{ marginTop: '10px' }}>
                <div>Screen New Shark</div>
                <h3 style={{ margin: '6px 0 0 0', color: '#fff' }}>Hungry Shark</h3>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="sidebar">
            <div>
              <label style={{ color: '#ff7a2b', fontWeight: '600' }}>FIND HUBS</label>
              <div className="search-small">
                <input 
                  placeholder="Find hubs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button className="small-ghost" onClick={() => showNotification("Searching hubs...")}>
                  🔍
                </button>
              </div>
            </div>

            <hr className="sep" />

            <div style={{ marginTop: '8px' }}>
              <label style={{ color: '#ff7a2b', fontWeight: '600' }}>FIND PEOPLE</label>
              <div className="search-small">
                <input placeholder="Find people..." />
                <button className="small-ghost">🔍</button>
              </div>
            </div>

            <hr className="sep" />

            <div style={{ marginTop: '16px' }}>
              <h3 style={{ margin: '0 0 12px 0', color: '#fff' }}>Yeah, I have set my new record!</h3>
              {badges.map((badge) => (
                <div key={badge.id} className="record-card">
                  <img src={badge.image} alt="Badge" />
                  <div>
                    <strong>{badge.title}</strong>
                  </div>
                </div>
              ))}
              <div style={{ marginTop: '8px' }}>Badge indicating a new record</div>
            </div>

            <hr className="sep" />

            <div style={{ marginTop: '16px' }}>
              <h3 style={{ margin: '0', color: '#fff' }}>Fruit Ninja</h3>
            </div>

            <button style={{ 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer', 
              padding: '0',
              color: '#c7b7b0',
              marginTop: '1rem',
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
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
          }}
        >
          {notification.message}
        </div>
      )}
    </>
  );
}
