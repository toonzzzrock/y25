"use client";
import React, { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import Header from "@/app/components/Header";
import "../game-detail.css";

type Game = {
  id: string;
  title: string;
  developer: string;
  banner: string;
  description: string;
  rating: number;
  downloads: string;
  releaseDate: string;
  genre: string;
  screenshots: string[];
};

const gameDetail: Game = {
  id: "altos-odyssey",
  title: "ALTO'S ODYSSEY",
  developer: "by JOHN SMITH",
  banner: "/images/altos-odyssey-main.svg",
  description:
    "Alto's Odyssey is a serene yet challenging adventure that lets you play through an endless dreamlike landscape. Go on a journey through deserts, canyons, and mountains as Alto, a snowboarder. Explore the world, discover secrets, and craft your own adventure.",
  rating: 4.8,
  downloads: "2.5M",
  releaseDate: "Mar 15, 2024",
  genre: "Adventure",
  screenshots: [
    "/images/altos-odyssey-main.svg",
    "/images/boxing-game.svg",
    "/images/mario-game.svg",
    "/images/racing-game.svg",
    "/images/city-game.svg",
    "/images/survival-game.svg",
  ],
};

export default function GameDetailPage() {
  const [notification, setNotification] = useState<{ message: string; type: string } | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const showNotification = useCallback((message: string, type: string = "info") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  const handleSearch = useCallback(() => {
    showNotification("Search functionality coming soon", "info");
  }, [showNotification]);

  const handleReport = useCallback(() => {
    showNotification("Report submitted successfully", "success");
  }, [showNotification]);

  const handlePlay = useCallback(() => {
    showNotification(`Starting ${gameDetail.title}...`, "success");
  }, [showNotification]);

  const handleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen);
    showNotification(isFullscreen ? "Exiting fullscreen" : "Entering fullscreen", "info");
  }, [isFullscreen, showNotification]);

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

  return (
    <>
      <Header
        showSearch={true}
        onSearch={handleSearch}
      />

      <main className="game-detail-main">
        <div className="game-detail-wrapper">
          {/* Left Content */}
          <div className="game-detail-content">
            {/* Game Hero Section */}
            <section className="game-hero">
              <div className="hero-container">
                <div className="game-banner-container">
                  <img src={gameDetail.banner} alt={gameDetail.title} className="game-banner-image" />
                </div>

                <div className="game-hero-info">
                  <div className="game-header-row">
                    <div>
                      <h1 className="game-title">{gameDetail.title}</h1>
                      <p className="game-developer">{gameDetail.developer}</p>
                    </div>
                    <button className="report-btn" onClick={handleReport}>
                      Report
                    </button>
                    <button className="fullscreen-btn" onClick={handleFullscreen} title="Full Screen">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
            </section>

            {/* Game Info Section */}
            <section className="game-info-section">
              <div className="game-info-header">
                <div className="game-info-left">
                  <h2 className="game-info-title">ABOUT THIS GAME</h2>
                </div>
              </div>

              {/* Game Description */}
              <div className="game-description">
                <h3>Description</h3>
                <p>{gameDetail.description}</p>
              </div>

              {/* Game Stats */}
              <div className="game-stats">
                <div className="stat-item">
                  <span className="stat-label">Rating</span>
                  {renderStars(gameDetail.rating)}
                  <span className="stat-value">{gameDetail.rating}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Downloads</span>
                  <span className="stat-value">{gameDetail.downloads}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Release Date</span>
                  <span className="stat-value">{gameDetail.releaseDate}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Genre</span>
                  <span className="stat-value">{gameDetail.genre}</span>
                </div>
              </div>

              {/* Play Button */}
              <button className="play-btn-large" onClick={handlePlay}>
                Play Now
              </button>
            </section>

            {/* Screenshots Section */}
            <section className="screenshots-section">
              <h3>Screenshots</h3>
              <div className="screenshots-grid">
                {gameDetail.screenshots.map((screenshot, index) => (
                  <div key={index} className="screenshot-item" onClick={() => showNotification(`Screenshot ${index + 1}`, "info")}>
                    <img src={screenshot} alt={`Screenshot ${index + 1}`} />
                  </div>
                ))}
              </div>
            </section>


          </div>

          {/* Right Sidebar - Advertising */}
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

      {/* Navigation Footer */}
      <footer className="game-detail-footer">
        <Link href="/home" className="back-link">
          ← Back to Games
        </Link>
      </footer>

      {/* Notification */}
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
