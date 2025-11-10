"use client";
import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();
  const [userType, setUserType] = useState<"user" | "publisher">("user");
  const [values, setValues] = useState({
    username: "",
    email: "",
    dateOfBirth: "",
    sex: "Other",
    password: "",
    confirmPassword: "",
    terms: false
  });
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Real-time password strength validation
  const passwordStrength = useMemo(() => {
    const pwd = values.password;
    const checks = {
      length: pwd.length >= 8,
      uppercase: /[A-Z]/.test(pwd),
      lowercase: /[a-z]/.test(pwd),
      digit: /[0-9]/.test(pwd),
      special: /[^A-Za-z0-9]/.test(pwd),
    };

    const passed = Object.values(checks).filter(Boolean).length;
    const isValid = Object.values(checks).every(Boolean);

    return { checks, passed, isValid, total: 5 };
  }, [values.password]);

  function show(message: string, type: 'success' | 'error' = 'success') {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    // Validation
    if (!values.username || !values.email || !values.dateOfBirth || !values.sex || !values.password || !values.confirmPassword) {
      show("Please fill in all fields", 'error');
      return;
    }

    if (!passwordStrength.isValid) {
      show("Password does not meet all requirements", 'error');
      return;
    }

    if (values.password !== values.confirmPassword) {
      show("Passwords do not match", 'error');
      return;
    }

    if (!values.terms) {
      show("Accept Terms & Conditions", 'error');
      return;
    }

    setLoading(true);
    try {
      await signup(values.username, values.email, values.dateOfBirth, values.sex, values.password, userType);
      show("Account created successfully! Redirecting to login...", 'success');
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (error: any) {
      show(error.message || "Failed to create account", 'error');
    } finally {
      setLoading(false);
    }
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
          <div className="signup-right-panel" style={{ overflowY: "auto" }}>
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
              <form className="signup-form" onSubmit={submit} style={{ overflow: "visible" }}>
                {/* Username */}
                <div className="form-group">
                  <input
                    type="text"
                    className="form-input signup-input"
                    placeholder="Username"
                    autoComplete="username"
                    value={values.username}
                    onChange={(e) => setValues((v) => ({ ...v, username: e.target.value }))}
                    required
                  />
                </div>

                {/* Email */}
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

                {/* Date of Birth */}
                <div className="form-group">
                  <input
                    type="date"
                    className="form-input signup-input"
                    value={values.dateOfBirth}
                    onChange={(e) => setValues((v) => ({ ...v, dateOfBirth: e.target.value }))}
                    required
                  />
                </div>

                {/* Sex */}
                <div className="form-group">
                  <select
                    className="form-input signup-input"
                    value={values.sex}
                    onChange={(e) => setValues((v) => ({ ...v, sex: e.target.value }))}
                    required
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Password */}
                <div className="form-group" style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    className="form-input signup-input"
                    placeholder="Password"
                    autoComplete="new-password"
                    value={values.password}
                    onChange={(e) => setValues((v) => ({ ...v, password: e.target.value }))}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: "10px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#999",
                    }}
                  >
                    {showPassword ? "👁️" : "👁️‍🗨️"}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {values.password && (
                  <div style={{ margin: "0.5rem 0", fontSize: "0.875rem" }}>
                    <div style={{ marginBottom: "0.5rem", fontWeight: 600 }}>
                      Password Strength: {passwordStrength.passed}/{passwordStrength.total}
                    </div>
                    <div style={{ display: "grid", gap: "0.25rem" }}>
                      <div style={{ color: passwordStrength.checks.length ? "#4caf50" : "#ccc" }}>
                        ✓ At least 8 characters
                      </div>
                      <div style={{ color: passwordStrength.checks.uppercase ? "#4caf50" : "#ccc" }}>
                        ✓ At least one UPPERCASE letter
                      </div>
                      <div style={{ color: passwordStrength.checks.lowercase ? "#4caf50" : "#ccc" }}>
                        ✓ At least one lowercase letter
                      </div>
                      <div style={{ color: passwordStrength.checks.digit ? "#4caf50" : "#ccc" }}>
                        ✓ At least one digit (0-9)
                      </div>
                      <div style={{ color: passwordStrength.checks.special ? "#4caf50" : "#ccc" }}>
                        ✓ At least one special character (!@#$%^&*)
                      </div>
                    </div>
                  </div>
                )}

                {/* Confirm Password */}
                <div className="form-group" style={{ position: "relative", marginTop: "1rem" }}>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    className="form-input signup-input"
                    placeholder="Confirm Password"
                    autoComplete="new-password"
                    value={values.confirmPassword}
                    onChange={(e) => setValues((v) => ({ ...v, confirmPassword: e.target.value }))}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{
                      position: "absolute",
                      right: "10px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#999",
                    }}
                  >
                    {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
                  </button>
                </div>

                {/* Password Match Indicator */}
                {values.confirmPassword && (
                  <div style={{
                    fontSize: "0.875rem",
                    color: values.password === values.confirmPassword ? "#4caf50" : "#f44336",
                    margin: "0.5rem 0",
                  }}>
                    {values.password === values.confirmPassword ? "✓ Passwords match" : "✗ Passwords do not match"}
                  </div>
                )}

                <div className="form-group checkbox-group" style={{ marginTop: "1rem" }}>
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
                <button
                  type="submit"
                  className="btn-join"
                  disabled={loading || !passwordStrength.isValid || values.password !== values.confirmPassword}
                >
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
            backgroundColor: notification.type === 'error' ? "#f44336" : "#4caf50",
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
