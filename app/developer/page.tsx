"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./developer.module.css";
import DeveloperLogoutButton from "./components/DeveloperLogoutButton";

interface SystemStats {
  uptime: number;
  uptimePercent: number;
  avgLoad: number;
  cpuCores: number;
  dbSize: string;
  apiRequestsThisHour: number;
  publicFolderSize: string;
  cpuUsage: number;
  memoryUsage: number;
  cpuHistory: number[];
  memoryHistory: number[];
  cpuMemoryTimestamps: string[];
  apiUsageHistory: number[];
}

interface ConJob {
  name: string;
  lastRun: string;
  status: "success" | "error";
}

export default function DeveloperDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [jobs, setJobs] = useState<ConJob[]>([]);
  const [loading, setLoading] = useState(true);

  // Check authentication on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch("/api/developer/session");
        const data = await response.json();
        if (!data.authenticated) {
          router.push("/developer/login");
        }
      } catch (error) {
        console.log("Session check failed:", error);
        router.push("/developer/login");
      }
    };
    checkSession();
  }, [router]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, jobsRes] = await Promise.all([
          fetch("/api/developer/stats"),
          fetch("/api/developer/jobs"),
        ]);

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }

        if (jobsRes.ok) {
          const jobsData = await jobsRes.json();
          setJobs(jobsData);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div style={{ backgroundColor: "#060404", minHeight: "100vh", color: "#e6e0db", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: "24px" }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "#060404", minHeight: "100vh", color: "#e6e0db" }}>
      <header className={styles["dev-header"]}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <span className={styles["logo-y25"]}>Y25</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <span className={styles["dev-label"]}>DEVELOPER</span>
          <DeveloperLogoutButton />
        </div>
      </header>

      <main className={styles["dev-main"]}>
        {/* System Status Section */}
        <section>
          <h2 className={styles["section-heading"]}>SYSTEM STATUS</h2>
          <div className={styles["status-grid"]}>
            {/* Uptime */}
            <div className={`${styles["status-card"]} ${styles["large-text-card"]}`}>
              <span className={styles["card-label"]}>Uptime</span>
              <span className={`${styles["card-value"]} ${styles["highlight-green"]}`}>
                {stats?.uptime || 48} hours
              </span>
            </div>

            {/* Avg Server Load */}
            <div className={`${styles["status-card"]} ${styles["large-text-card"]}`}>
              <span className={styles["card-label"]}>Avg Server Load</span>
              <span className={styles["card-value"]}>
                <span className={styles["icon-flash"]}>⚡</span> {stats?.avgLoad || 0.82} / {stats?.cpuCores || 4}
              </span>
              <div style={{ fontSize: "11px", marginTop: "4px", color: "#888" }}>
                cores
              </div>
            </div>

            {/* CPU / Memory Usage Chart */}
            <div className={`${styles["status-card"]} ${styles["chart-card"]}`}>
              <span className={styles["card-label"]}>CPU / Memory Usage</span>
              <div className={styles["chart-placeholder"]} style={{ minHeight: "400px" }}>
                <svg width="100%" height="100%" viewBox="0 0 400 350" preserveAspectRatio="xMidYMid meet">
                  {/* Y-axis labels */}
                  <text x="15" y="20" fontSize="12" fill="#666" textAnchor="end" fontWeight="bold">
                    100%
                  </text>
                  <text x="15" y="180" fontSize="12" fill="#666" textAnchor="end" fontWeight="bold">
                    50%
                  </text>
                  <text x="15" y="340" fontSize="12" fill="#666" textAnchor="end" fontWeight="bold">
                    0%
                  </text>

                  {/* X-axis time labels */}
                  {stats?.cpuMemoryTimestamps && stats.cpuMemoryTimestamps.length > 0 ? (
                    <>
                      <text x="30" y="350" fontSize="11" fill="#666" textAnchor="middle">
                        {stats.cpuMemoryTimestamps[0]}
                      </text>
                      {stats.cpuMemoryTimestamps.length > 3 && (
                        <text x="120" y="350" fontSize="11" fill="#666" textAnchor="middle">
                          {stats.cpuMemoryTimestamps[Math.floor(stats.cpuMemoryTimestamps.length * 0.33)]}
                        </text>
                      )}
                      {stats.cpuMemoryTimestamps.length > 2 && (
                        <text x="210" y="350" fontSize="11" fill="#666" textAnchor="middle">
                          {stats.cpuMemoryTimestamps[Math.floor(stats.cpuMemoryTimestamps.length * 0.5)]}
                        </text>
                      )}
                      {stats.cpuMemoryTimestamps.length > 3 && (
                        <text x="300" y="350" fontSize="11" fill="#666" textAnchor="middle">
                          {stats.cpuMemoryTimestamps[Math.floor(stats.cpuMemoryTimestamps.length * 0.67)]}
                        </text>
                      )}
                      <text x="390" y="350" fontSize="11" fill="#666" textAnchor="middle">
                        {stats.cpuMemoryTimestamps[stats.cpuMemoryTimestamps.length - 1]}
                      </text>
                    </>
                  ) : (
                    <>
                      <text x="30" y="350" fontSize="11" fill="#666" textAnchor="middle">
                        0s
                      </text>
                      <text x="120" y="350" fontSize="11" fill="#666" textAnchor="middle">
                        5s
                      </text>
                      <text x="210" y="350" fontSize="11" fill="#666" textAnchor="middle">
                        10s
                      </text>
                      <text x="300" y="350" fontSize="11" fill="#666" textAnchor="middle">
                        15s
                      </text>
                      <text x="390" y="350" fontSize="11" fill="#666" textAnchor="middle">
                        20s
                      </text>
                    </>
                  )}

                  {/* Y-axis line */}
                  <line x1="25" y1="10" x2="25" y2="330" stroke="#333" strokeWidth="1.5" />
                  {/* X-axis line */}
                  <line x1="25" y1="330" x2="390" y2="330" stroke="#333" strokeWidth="1.5" />

                  {/* CPU line (blue) */}
                  <polyline
                    points={
                      stats?.cpuHistory
                        ?.map(
                          (val, i) =>
                            `${30 + (i / (stats.cpuHistory.length - 1)) * 350},${330 - (val / 100) * 320}`
                        )
                        .join(" ") || "30,330 65,240 100,280 135,160 170,200 205,100 240,170 275,80 310,150 345,50"
                    }
                    fill="none"
                    stroke="#00aaff"
                    strokeWidth="3"
                  />
                  {/* Memory line (orange) */}
                  <polyline
                    points={
                      stats?.memoryHistory
                        ?.map(
                          (val, i) =>
                            `${30 + (i / (stats.memoryHistory.length - 1)) * 350},${330 - (val / 100) * 320}`
                        )
                        .join(" ") || "30,300 65,220 100,260 135,140 170,180 205,80 240,150 275,60 310,130 345,30"
                    }
                    fill="none"
                    stroke="#ff7a2b"
                    strokeWidth="3"
                  />

                  {/* Grid lines - horizontal */}
                  <line x1="25" y1="170" x2="390" y2="170" stroke="#333" strokeWidth="0.5" strokeDasharray="3,3" opacity="0.5" />
                  <line x1="25" y1="85" x2="390" y2="85" stroke="#333" strokeWidth="0.5" strokeDasharray="3,3" opacity="0.5" />
                  <line x1="25" y1="255" x2="390" y2="255" stroke="#333" strokeWidth="0.5" strokeDasharray="3,3" opacity="0.5" />

                  {/* Legend */}
                  <circle cx="60" cy="25" r="4" fill="#00aaff" />
                  <text x="70" y="30" fontSize="12" fill="#00aaff" fontWeight="bold">
                    CPU: {stats?.cpuUsage || 0}%
                  </text>
                  <circle cx="240" cy="25" r="4" fill="#ff7a2b" />
                  <text x="250" y="30" fontSize="12" fill="#ff7a2b" fontWeight="bold">
                    MEM: {stats?.memoryUsage || 0}%
                  </text>
                </svg>
              </div>
            </div>

            {/* API Usage Chart */}
            <div className={`${styles["status-card"]} ${styles["chart-card"]}`}>
              <span className={styles["card-label"]}>API Usage (24h)</span>
              <div className={styles["chart-placeholder"]} style={{ minHeight: "400px" }}>
                <svg width="100%" height="100%" viewBox="0 0 500 380" preserveAspectRatio="xMidYMid meet">
                  {/* Y-axis labels */}
                  <text x="20" y="20" fontSize="12" fill="#666" textAnchor="end" fontWeight="bold">
                    500
                  </text>
                  <text x="20" y="200" fontSize="12" fill="#666" textAnchor="end" fontWeight="bold">
                    250
                  </text>
                  <text x="20" y="360" fontSize="12" fill="#666" textAnchor="end" fontWeight="bold">
                    0
                  </text>

                  {/* Y-axis line */}
                  <line x1="30" y1="10" x2="30" y2="360" stroke="#333" strokeWidth="1.5" />
                  {/* X-axis line */}
                  <line x1="30" y1="360" x2="480" y2="360" stroke="#333" strokeWidth="1.5" />

                  {/* Grid lines - horizontal */}
                  <line x1="30" y1="185" x2="480" y2="185" stroke="#333" strokeWidth="0.5" strokeDasharray="3,3" opacity="0.5" />
                  <line x1="30" y1="95" x2="480" y2="95" stroke="#333" strokeWidth="0.5" strokeDasharray="3,3" opacity="0.5" />
                  <line x1="30" y1="275" x2="480" y2="275" stroke="#333" strokeWidth="0.5" strokeDasharray="3,3" opacity="0.5" />

                  {stats?.apiUsageHistory && stats.apiUsageHistory.length > 0 ? (
                    <>
                      {/* Bars for API requests */}
                      {stats.apiUsageHistory.map((value, index) => (
                        <rect
                          key={`bar-${index}`}
                          x={35 + (index * 15)}
                          y={360 - (value / 500) * 350}
                          width="13"
                          height={(value / 500) * 350}
                          fill="#ff7a2b"
                          opacity="0.85"
                          rx="2"
                        />
                      ))}
                      {/* X-axis hour labels */}
                      <text x="40" y="378" fontSize="11" fill="#555" textAnchor="middle" fontWeight="bold">
                        00
                      </text>
                      <text x="130" y="378" fontSize="11" fill="#555" textAnchor="middle" fontWeight="bold">
                        06
                      </text>
                      <text x="220" y="378" fontSize="11" fill="#555" textAnchor="middle" fontWeight="bold">
                        12
                      </text>
                      <text x="310" y="378" fontSize="11" fill="#555" textAnchor="middle" fontWeight="bold">
                        18
                      </text>
                      <text x="400" y="378" fontSize="11" fill="#555" textAnchor="middle" fontWeight="bold">
                        23
                      </text>
                    </>
                  ) : (
                    /* Fallback bars */
                    <>
                      <rect x="35" y="280" width="13" height="80" fill="#ff7a2b" opacity="0.8" rx="2" />
                      <rect x="53" y="300" width="13" height="60" fill="#ff7a2b" opacity="0.8" rx="2" />
                      <rect x="71" y="220" width="13" height="140" fill="#ff7a2b" opacity="0.8" rx="2" />
                      <rect x="89" y="270" width="13" height="90" fill="#ff7a2b" opacity="0.8" rx="2" />
                      <rect x="107" y="240" width="13" height="120" fill="#ff7a2b" opacity="0.8" rx="2" />
                      <rect x="125" y="270" width="13" height="90" fill="#ff7a2b" opacity="0.8" rx="2" />
                      <rect x="143" y="210" width="13" height="150" fill="#ff7a2b" opacity="0.8" rx="2" />
                      <rect x="161" y="280" width="13" height="80" fill="#ff7a2b" opacity="0.8" rx="2" />
                      
                      <text x="40" y="378" fontSize="11" fill="#555" textAnchor="middle" fontWeight="bold">
                        00
                      </text>
                      <text x="130" y="378" fontSize="11" fill="#555" textAnchor="middle" fontWeight="bold">
                        06
                      </text>
                      <text x="220" y="378" fontSize="11" fill="#555" textAnchor="middle" fontWeight="bold">
                        12
                      </text>
                      <text x="310" y="378" fontSize="11" fill="#555" textAnchor="middle" fontWeight="bold">
                        18
                      </text>
                      <text x="400" y="378" fontSize="11" fill="#555" textAnchor="middle" fontWeight="bold">
                        23
                      </text>
                    </>
                  )}
                </svg>
              </div>
            </div>

            {/* DB Size */}
            <div className={`${styles["status-card"]} ${styles["large-text-card"]}`}>
              <span className={styles["card-label"]}>DB Size</span>
              <span className={styles["card-value"]}>
                {stats?.dbSize || "12.3 GB"}
              </span>
            </div>

            {/* API Requests */}
            <div className={`${styles["status-card"]} ${styles["large-text-card"]}`}>
              <span className={styles["card-label"]}>API Requests (This Hour)</span>
              <span className={styles["card-value"]}>
                <span className={styles["icon-server"]}>💻</span> {stats?.apiRequestsThisHour || 15}
              </span>
            </div>

            {/* Public Folder Size */}
            <div className={`${styles["status-card"]} ${styles["large-text-card"]}`}>
              <span className={styles["card-label"]}>Public Folder</span>
              <span className={styles["card-value"]}>
                {stats?.publicFolderSize || "5.2 GB"}
              </span>
            </div>
          </div>
        </section>

        {/* Jobs, Errors, Version Control Section */}
        <section>
          <div className={styles["jobs-errors-grid"]}>
            {/* Con Jobs Card */}
            <div className={styles["card"]}>
              <h2 className={styles["section-heading"]}>Con Jobs</h2>
              <table>
                <thead>
                  <tr>
                    <th>Job</th>
                    <th>Last Run</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => (
                    <tr key={job.name}>
                      <td>{job.name}</td>
                      <td>{job.lastRun}</td>
                      <td>
                        <span className={`${styles["status-icon"]} ${styles[job.status]}`}>
                          {job.status === "success" ? "✓" : "✕"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Latest Errors Card */}
            <div className={styles["card"]}>
              <h2 className={styles["section-heading"]}>Latest Errors</h2>
              <p className={styles["error-message"]}>NullRef@uploadHandler.js.120</p>
              <p className={styles["error-message"]}>Timeout@DB query {"{user}"}</p>
              <p className={styles["error-message"]}>FileNotFound@mediaServer.ts.45</p>
              <button className={styles["reset-cache-btn"]}>Reset Cache</button>
            </div>

            {/* Version Control Card */}
            <div className={styles["card"]}>
              <h2 className={styles["section-heading"]}>Version Control</h2>
              <p className={styles["version-item"]}>v1.0.12 {"{ffx upload}"}</p>
              <p className={styles["version-item"]}>v1.0.11 {"{API patch}"}</p>
              <p className={styles["version-item"]}>v1.0.10 {"{UI fix}"}</p>
              <button className={styles["webhook-logs-btn"]}>Webhook Logs</button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
