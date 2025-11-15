"use client";

import { FormEvent, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./login.module.css";

export default function DeveloperLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Check if already logged in
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch("/api/developer/session");
        const data = await response.json();
        if (data.authenticated) {
          router.push("/developer");
        }
      } catch (err) {
        console.log("Session check failed:", err);
      }
    };
    checkSession();
  }, [router]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/developer/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Login failed");
        setIsLoading(false);
        return;
      }

      // Login successful, redirect to developer dashboard
      router.push("/developer");
    } catch (err) {
      console.error("Login error:", err);
      setError("An error occurred during login");
      setIsLoading(false);
    }
  };

  return (
    <div className={styles["login-container"]}>
      <div className={styles["login-box"]}>
        <div className={styles["header"]}>
          <h1 className={styles["logo"]}>Y25</h1>
          <p className={styles["subtitle"]}>DEVELOPER ACCESS</p>
        </div>

        <form onSubmit={handleSubmit} className={styles["form"]}>
          <div className={styles["form-group"]}>
            <label htmlFor="username" className={styles["label"]}>
              Username
            </label>
            <input
              id="username"
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={styles["input"]}
              disabled={isLoading}
              required
            />
          </div>

          <div className={styles["form-group"]}>
            <label htmlFor="password" className={styles["label"]}>
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles["input"]}
              disabled={isLoading}
              required
            />
          </div>

          {error && <div className={styles["error-message"]}>{error}</div>}

          <button
            type="submit"
            className={styles["login-button"]}
            disabled={isLoading}
          >
            {isLoading ? "Logging in..." : "LOGIN"}
          </button>
        </form>

        <div className={styles["footer"]}>
          <p>Developer Console</p>
        </div>
      </div>
    </div>
  );
}
