"use client";
import React, { useState } from "react";
import Link from "next/link";

export default function SignupPage() {
  const [userType, setUserType] = useState<"user" | "publisher">("user");
  const [values, setValues] = useState({ firstName: "", lastName: "", email: "", password: "", terms: false });
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  function show(message: string) {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!values.firstName || !values.lastName || !values.email || !values.password) {
      show("Please fill in all fields");
      return;
    }
    if (values.password.length < 8) {
      show("Password must be at least 8 characters");
      return;
    }
    if (!values.terms) {
      show("Accept Terms & Conditions");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      show("Account created successfully!");
    }, 1500);
  }

  return (
    <>
      <header className="header">
        <div className="logo">
          <span className="logo-y25">Y25</span>
          <span className="logo-divider">/</span>
          <span className="logo-text">ONLINE GAME PLATFORM</span>
        </div>
        <nav className="nav">
          <Link href="/" className="btn-signup">Login</Link>
        </nav>
      </header>
      <main className="main-content">
        <div className="signup-wrapper">
          <div className="signup-left-panel">
            <Link className="back-button" href="/">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
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
                  >
                    {t === "user" ? "User" : "Publisher"}
                  </button>
                ))}
              </div>
              <form className="signup-form" onSubmit={submit}>
                <div className="form-group">
                  <input
                    type="text"
                    className="form-input signup-input"
                    placeholder="First name"
                    autoComplete="given-name"
                    value={values.firstName}
                    onChange={(e) => setValues((v) => ({ ...v, firstName: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <input
                    type="text"
                    className="form-input signup-input"
                    placeholder="Last name"
                    autoComplete="family-name"
                    value={values.lastName}
                    onChange={(e) => setValues((v) => ({ ...v, lastName: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <input
                    type="email"
                    className="form-input signup-input"
                    placeholder="Email address"
                    autoComplete="email"
                    value={values.email}
                    onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
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
                    value={values.password}
                    onChange={(e) => setValues((v) => ({ ...v, password: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      className="checkbox-input"
                      checked={values.terms}
                      onChange={(e) => setValues((v) => ({ ...v, terms: e.target.checked }))}
                      required
                    />
                    <span className="checkbox-custom" />
                    <span className="checkbox-text">Accept Terms & Conditions</span>
                  </label>
                </div>
                <button type="submit" className="btn-join" disabled={loading}>
                  <span>{loading ? "Creating account..." : "Join us"}</span>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7 3L14 10L7 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <div className="form-footer">
                  <p>
                    Already have an account? <Link href="/" className="login-link">Login</Link>
                  </p>
                </div>
              </form>
              <div style={{ marginTop: "1rem", textAlign: "center" }}>
                <Link href="/home" className="login-link" style={{ textDecoration: "underline" }}>
                  Go to Home
                </Link>
              </div>
            </div>
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
            backgroundColor: "#4caf50",
            color: "white",
            fontWeight: 600,
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            zIndex: 1000,
            animation: "slideIn 0.3s ease-out",
          }}
        >
          {notification}
        </div>
      )}
    </>
  );
}
