"use client";
import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";

export default function HomeLoginPage() {
  const [signupOpen, setSignupOpen] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginValues, setLoginValues] = useState({ username: "", password: "" });
  const [notification, setNotification] = useState<{ message: string; type: string } | null>(null);
  const [userType, setUserType] = useState<"user" | "publisher">("user");
  const [signupValues, setSignupValues] = useState({ firstName: "", lastName: "", email: "", password: "", terms: false });
  const [signupLoading, setSignupLoading] = useState(false);

  const showNotification = useCallback((message: string, type: string = "info") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && signupOpen) setSignupOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [signupOpen]);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { username, password } = loginValues;
    if (!username || !password) {
      showNotification("Please fill in all fields", "error");
      return;
    }
    setLoginLoading(true);
    showNotification("Logging in...", "info");
    setTimeout(() => {
      setLoginLoading(false);
      showNotification("Login successful!", "success");
    }, 1500);
  };

  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { firstName, lastName, email, password, terms } = signupValues;
    if (!firstName || !lastName || !email || !password) {
      showNotification("Please fill in all fields", "error");
      return;
    }
    if (password.length < 8) {
      showNotification("Password must be at least 8 characters", "error");
      return;
    }
    if (!terms) {
      showNotification("Accept Terms & Conditions", "error");
      return;
    }
    setSignupLoading(true);
    showNotification("Creating account...", "info");
    setTimeout(() => {
      setSignupLoading(false);
      showNotification("Account created successfully!", "success");
      setSignupOpen(false);
      setSignupValues({ firstName: "", lastName: "", email: "", password: "", terms: false });
    }, 2000);
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
          <button className="btn-signup" onClick={() => setSignupOpen(true)}>
            Sign Up
          </button>
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
                placeholder="Username"
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
      {signupOpen && (
        <div className="modal-overlay active" onClick={(e) => e.target === e.currentTarget && setSignupOpen(false)}>
          <div className="signup-wrapper">
            <div className="signup-left-panel">
              <button className="back-button" onClick={() => setSignupOpen(false)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <div className="decorative-content">
                <div className="red-circle" />
                <div className="star-burst" />
                <div className="line-pattern" />
                <h2 className="panel-title">
                  <span className="title-create">CREATE</span>
                  <span className="title-your">YOUR</span>
                  <span className="title-account">ACCOUNT</span>
                </h2>
                <div className="game-icon">
                  <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M30 5L35 20L50 25L35 30L30 45L25 30L10 25L25 20L30 5Z" fill="currentColor" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="signup-right-panel">
              <div className="signup-container">
                <h1 className="signup-title">Sign Up</h1>
                <div className="user-type-toggle">
                  {(["user", "publisher"] as const).map((t) => (
                    <button
                      type="button"
                      key={t}
                      className={`toggle-btn ${userType === t ? "active" : ""}`}
                      onClick={() => setUserType(t)}
                      data-type={t}
                    >
                      {t === "user" ? "User" : "Publisher"}
                    </button>
                  ))}
                </div>
                <form className="signup-form" onSubmit={handleSignupSubmit}>
                  <div className="form-group">
                    <input
                      type="text"
                      className="form-input signup-input"
                      placeholder="First name"
                      autoComplete="given-name"
                      value={signupValues.firstName}
                      onChange={(e) => setSignupValues((v) => ({ ...v, firstName: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <input
                      type="text"
                      className="form-input signup-input"
                      placeholder="Last name"
                      autoComplete="family-name"
                      value={signupValues.lastName}
                      onChange={(e) => setSignupValues((v) => ({ ...v, lastName: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <input
                      type="email"
                      className="form-input signup-input"
                      placeholder="Email address"
                      autoComplete="email"
                      value={signupValues.email}
                      onChange={(e) => setSignupValues((v) => ({ ...v, email: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <input
                      type="password"
                      className="form-input signup-input"
                      placeholder="Password"
                      autoComplete="new-password"
                      minLength={8}
                      value={signupValues.password}
                      onChange={(e) => setSignupValues((v) => ({ ...v, password: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-group checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        className="checkbox-input"
                        checked={signupValues.terms}
                        onChange={(e) => setSignupValues((v) => ({ ...v, terms: e.target.checked }))}
                        required
                      />
                      <span className="checkbox-custom" />
                      <span className="checkbox-text">Accept Terms & Conditions</span>
                    </label>
                  </div>
                  <button type="submit" className="btn-join" disabled={signupLoading}>
                    <span>{signupLoading ? "Creating account..." : "Join us"}</span>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M7 3L14 10L7 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <div className="form-footer">
                    <p>
                      Already have an account?{" "}
                      <a
                        href="#"
                        className="login-link"
                        onClick={(e) => {
                          e.preventDefault();
                          setSignupOpen(false);
                        }}
                      >
                        Login
                      </a>
                    </p>
                  </div>
                </form>
              </div>
            </div>
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
            animation: "slideIn 0.3s ease-out",
          }}
        >
          {notification.message}
        </div>
      )}
    </>
  );
}
