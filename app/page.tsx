"use client";
import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

export default function HomeLoginPage() {
  const router = useRouter();
  const { login, authenticated, loading: authLoading } = useAuth();
  const [signupOpen, setSignupOpen] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginValues, setLoginValues] = useState({ username: "", password: "" });
  const [notification, setNotification] = useState<{ message: string; type: string } | null>(null);

  const showNotification = useCallback((message: string, type: string = "info") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  // Redirect to home if already authenticated
  useEffect(() => {
    if (authenticated && !authLoading) {
      router.push('/home');
    }
  }, [authenticated, authLoading, router]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && signupOpen) setSignupOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [signupOpen]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { username, password } = loginValues;
    if (!username || !password) {
      showNotification("Please fill in all fields", "error");
      return;
    }
    
    setLoginLoading(true);
    try {
      await login(username, password);
      showNotification("Login successful! Redirecting...", "success");
      setTimeout(() => {
        router.push('/home');
      }, 1000);
    } catch (error: any) {
      showNotification(error.message || "Login failed", "error");
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <>
      <header className="header">
        <div className="logo">
          <span className="logo-y25">Y25</span>
          <span className="logo-divider">/</span>
          <span className="logo-text">ONLINE GAME PLATFORM</span>
        </div>
        <nav className="nav">
          <Link href="/signup" className="btn-signup">
            Sign Up
          </Link>
        </nav>
      </header>
      <main className="main-content">
        <div className="login-container">
          <h1 className="login-title">
            LOGIN TO <span className="highlight">Y25</span>
          </h1>
          <form className="login-form" onSubmit={handleLoginSubmit}>
            <div className="form-group">
              <input
                type="text"
                className="form-input"
                placeholder="Username or Email"
                autoComplete="username"
                value={loginValues.username}
                onChange={(e) => setLoginValues((v) => ({ ...v, username: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <input
                type="password"
                className="form-input"
                placeholder="Password"
                autoComplete="current-password"
                value={loginValues.password}
                onChange={(e) => setLoginValues((v) => ({ ...v, password: e.target.value }))}
                required
              />
            </div>
            <div className="form-footer">
              <a href="#" className="forgot-link" onClick={(e) => e.preventDefault()}>
                Forgot Password or Username?
              </a>
            </div>
            <button type="submit" className="btn-login" disabled={loginLoading}>
              <svg className="btn-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                <path
                  d="M8 12L12 16L16 12M12 8V16"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>{loginLoading ? "Logging in..." : "Login"}</span>
            </button>
          </form>
          <div style={{ marginTop: "1rem" }}>
            <Link href="/home" className="forgot-link" style={{ textDecoration: "underline" }}>
              Continue to Home (demo)
            </Link>
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
            animation: "slideIn 0.3s ease-out",
          }}
        >
          {notification.message}
        </div>
      )}
    </>
  );
}
