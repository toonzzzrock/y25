"use client";
import React, { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useProtectedRoute } from "@/lib/use-protected-route";
import "../home.css";

type Game = { id: string; img: string; alt: string; section: "trending" | "new" };
const trendingGames: Game[] = [
  { id: "boxing", img: "/images/boxing-game.svg", alt: "Boxing Game", section: "trending" },
  { id: "platform", img: "/images/mario-game.svg", alt: "Platform Game", section: "trending" },
  { id: "racing", img: "/images/racing-game.svg", alt: "Racing Game", section: "trending" },
  { id: "city", img: "/images/city-game.svg", alt: "City Builder", section: "trending" },
  { id: "survival", img: "/images/survival-game.svg", alt: "Survival Game", section: "trending" },
  { id: "space", img: "/images/space-shooter.svg", alt: "Space Shooter", section: "trending" },
  { id: "underwater", img: "/images/underwater-game.svg", alt: "Underwater Game", section: "trending" },
  { id: "dungeon", img: "/images/dungeon-game.svg", alt: "Dungeon Game", section: "trending" },
];
const newGames: Game[] = [
  { id: "kawai", img: "/images/farm-game.svg", alt: "Kawai Run", section: "new" },
  { id: "squirrel", img: "/images/jungle-game.svg", alt: "Squirrel Game", section: "new" },
  { id: "flaaaa", img: "/images/adventure-game.svg", alt: "Flaaaa vs Mutt", section: "new" },
  { id: "petfriends", img: "/images/forest-game.svg", alt: "Pet Friends", section: "new" },
  { id: "jungle", img: "/images/castle-game.svg", alt: "Jungle Game", section: "new" },
  { id: "winter", img: "/images/winter-game.svg", alt: "Winter Game", section: "new" },
  { id: "pirate", img: "/images/pirate-game.svg", alt: "Pirate Game", section: "new" },
  { id: "candy", img: "/images/candy-game.svg", alt: "Candy Game", section: "new" },
];

const categories = ["all", "shooting", "kids", "sport", "fighting"] as const;

export default function HomePage() {
  // All hooks must be called unconditionally at the top
  const { isLoading } = useProtectedRoute();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [notification, setNotification] = useState<{ message: string; type: string } | null>(null);

  const showNotification = useCallback((message: string, type: string = "info") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  function handleSearch() {
    const q = searchQuery.trim();
    if (q) showNotification(`Searching for "${q}"...`, "info");
  }

  function handlePlay(game: Game) {
    showNotification(`Starting ${game.alt}...`, "success");
  }

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
      <header className="home-header">
        <div className="logo">
          <span className="logo-y25">Y25</span>
        </div>
        <div className="search-container">
          <input
            type="text"
            className="search-input"
            placeholder="Search the game"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <button className="search-button" onClick={handleSearch}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
              <path d="M21 21L16.5 16.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <button className="user-icon-btn" onClick={() => router.push('/profile')}> 
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="15" stroke="currentColor" strokeWidth="2" />
            <circle cx="16" cy="12" r="5" fill="currentColor" />
            <path d="M6 26C6 21 10 18 16 18C22 18 26 21 26 26" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </header>
      <nav className="category-nav">
        {categories.map((c) => (
          <button
            key={c}
            className={`category-btn ${activeCategory === c ? "active" : ""}`}
            data-category={c}
            onClick={() => {
              setActiveCategory(c);
              showNotification(`Showing ${c} games`, "info");
            }}
          >
            {c === "kids" ? "For kid" : c === "all" ? "All games" : c.charAt(0).toUpperCase() + c.slice(1)}
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
            <section className="game-section">
              <div className="section-header">
                <h2 className="section-title">TRENDING</h2>
                <button className="section-arrow" onClick={() => showNotification("Loading more trending games...", "info")}>
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 8L20 16L12 24" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
              <div className="game-grid trending-grid">
                {trendingGames.map((g) => (
                  <div key={g.id} className="game-card" onClick={() => showNotification("Game card clicked", "info")}> 
                    <img src={g.img} alt={g.alt} className="game-image" />
                    <div className="game-overlay">
                      <button className="play-btn" onClick={(e) => { e.stopPropagation(); handlePlay(g); }}>Play Now</button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
            <section className="game-section">
              <div className="section-header">
                <h2 className="section-title">NEW GAME</h2>
                <button className="section-arrow" onClick={() => showNotification("Loading more new games...", "info")}>
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 8L20 16L12 24" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
              <div className="game-grid newgame-grid">
                {newGames.map((g) => (
                  <div key={g.id} className="game-card" onClick={() => showNotification("Game card clicked", "info")}> 
                    <img src={g.img} alt={g.alt} className="game-image" />
                    <div className="game-overlay">
                      <button className="play-btn" onClick={(e) => { e.stopPropagation(); handlePlay(g); }}>Play Now</button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
          <aside className="community-sidebar">
            <div className="community-header">
              <div className="community-icon" />
              <h3 className="community-title">COMMUNITY</h3>
            </div>
            <div className="popular-hubs">
              <h4 className="hubs-title">Popular Hubs</h4>
              <div className="hub-list">
                {["Bad Ice-cream|330 new artwork this week|ff6b4a", "Fruit Ninja|555 new screenshots|4aff6b", "Hungry Shark|288 new screenshots|4a9eff", "Plants vs. Zombies 2|144 new screenshots|8bff4a"].map((hub) => {
                  const [name, stats, color] = hub.split("|");
                  return (
                    <div key={name} className="hub-item" onClick={() => showNotification(`Opening ${name} community...`, "info")}> 
                      <img
                        src={`https://via.placeholder.com/40x40/${color}/ffffff?text=${name.split(" ")[0].substring(0,2).toUpperCase()}`}
                        alt={name}
                        className="hub-avatar"
                      />
                      <div className="hub-info">
                        <h5 className="hub-name">{name}</h5>
                        <p className="hub-stats">{stats}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <button className="view-more-btn" onClick={() => showNotification("Loading more communities...", "info")}>View more</button>
            </div>
            <div style={{ marginTop: "1rem" }}>
              <Link href="/" className="forgot-link" style={{ textDecoration: "underline" }}>
                Back to Login
              </Link>
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
