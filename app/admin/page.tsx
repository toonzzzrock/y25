import type { Metadata } from "next";
import type { RowDataPacket } from "mysql2";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { pool } from "@/lib/db";
import styles from "./admin.module.css";
import { ManageCard } from "./components/ManageCard";
import { GamesGrid } from "./components/GamesGrid";
import { SignupChart } from "./components/SignupChart";
import { PendingGamesList } from "./components/PendingGamesList";
import { ManageCardWrapper } from "./components/ManageCardWrapper";
import { SignupForm } from "./components/SignupForm";
import { formatDate } from "./utils/formatters";
import { AdminLogoutButton } from "./components/AdminLogoutButton";

type PopularGame = {
  id: number;
  name: string;
  totalPlayers: number;
};

type UserSummary = {
  username: string;
  email: string;
  createdAt: string;
};

type PublisherSummary = {
  username: string;
  accountName: string | null;
  publishedGames: number;
};

type GameSummary = {
  id: number;
  name: string;
  status: string;
  totalPlayers: number;
};

type PendingGame = {
  id: number;
  name: string;
  publisher: string;
  status: string;
  releaseDate: string | null;
  formattedDate: string;
};

type DashboardData = {
  analytics: {
    dailyUsers: number;
    averagePlayTime: number;
    popularGames: PopularGame[];
    timeseries: {
      month: string;
      label: string;
      signups: number;
      totalPlayers: number;
    }[];
  };
  users: UserSummary[];
  publishers: PublisherSummary[];
  games: GameSummary[];
  pendingGames: PendingGame[];
};

const TARGET_YEAR = 2025;

const numberFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const minutesFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1,
});

const monthLabelFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
});

function formatAveragePlayTime(minutes: number): string {
  if (!minutes || minutes < 0) {
    return "0 mins";
  }

  if (minutes >= 60) {
    const hours = minutes / 60;
    return `${minutesFormatter.format(hours)} hrs`;
  }

  return `${minutesFormatter.format(minutes)} mins`;
}

async function getSiteAnalytics(): Promise<DashboardData["analytics"]> {
  try {
    const [dailyRows] = await pool.query<RowDataPacket[]>(
  `SELECT COUNT(DISTINCT username) AS count
   FROM \`session\`
   WHERE last_login_time >= DATE_SUB(NOW(), INTERVAL 1 DAY)`
    );

    const dailyRow = dailyRows[0] as RowDataPacket & { count?: number };
    let dailyUsers = Number(dailyRow?.count ?? 0);

    if (!dailyUsers) {
      const [fallbackRows] = await pool.query<RowDataPacket[]>(
  `SELECT COUNT(DISTINCT username) AS count FROM \`session\``
      );
      const fallbackRow = fallbackRows[0] as RowDataPacket & { count?: number };
      dailyUsers = Number(fallbackRow?.count ?? 0);
    }

    const [incomeRows] = await pool.query<RowDataPacket[]>(
    `SELECT COALESCE(AVG(average_play_time), 0) AS averagePlayTime
     FROM \`game\`
   WHERE status IN ('Approve', 'Approved', 'Published')`
    );
   const incomeRow = incomeRows[0] as RowDataPacket & { averagePlayTime?: number };

    const [popularRows] = await pool.query<RowDataPacket[]>(
  `SELECT game_id AS id, game_name AS name, total_players AS totalPlayers
   FROM \`game\`
       WHERE status IN ('Approve', 'Approved', 'Published')
       ORDER BY total_players DESC, game_name ASC
       LIMIT 3`
    );

    const [signupRows] = await pool.query<RowDataPacket[]>(
      `SELECT DATE_FORMAT(created_at, '%Y-%m') AS month, COUNT(*) AS signups
       FROM \`User\`
       WHERE YEAR(created_at) = ?
       GROUP BY month
       ORDER BY month ASC`,
      [TARGET_YEAR]
    );

    const [playerRows] = await pool.query<RowDataPacket[]>(
      `SELECT DATE_FORMAT(last_login_time, '%Y-%m') AS month,
              COUNT(DISTINCT username) AS totalPlayers
       FROM \`session\`
       WHERE last_login_time IS NOT NULL
         AND YEAR(last_login_time) = ?
       GROUP BY month
       ORDER BY month ASC`,
      [TARGET_YEAR]
    );

    const signupMap = new Map<string, number>();
    signupRows.forEach((row) => {
      const key = String(row.month ?? "");
      signupMap.set(key, Number(row.signups ?? 0));
    });

    const playerMap = new Map<string, number>();
    playerRows.forEach((row) => {
      const key = String(row.month ?? "");
      playerMap.set(key, Number(row.totalPlayers ?? 0));
    });

    const timeseries = Array.from({ length: 12 }, (_, index) => {
      const monthDate = new Date(TARGET_YEAR, index, 1);
      const key = `${TARGET_YEAR}-${String(index + 1).padStart(2, "0")}`;
      return {
        month: key,
        label: monthLabelFormatter.format(monthDate),
        signups: signupMap.get(key) ?? 0,
        totalPlayers: playerMap.get(key) ?? 0,
      };
    });

    const popularGames: PopularGame[] = popularRows.map((row) => ({
      id: Number(row.id ?? 0),
      name: String(row.name ?? "Unknown"),
      totalPlayers: Number(row.totalPlayers ?? 0),
    }));

    return {
      dailyUsers,
      averagePlayTime: Number(incomeRow?.averagePlayTime ?? 0),
      popularGames,
      timeseries,
    };
  } catch (error) {
    console.error("Failed to load analytics", error);
    return {
      dailyUsers: 0,
      averagePlayTime: 0,
      popularGames: [],
      timeseries: Array.from({ length: 12 }, (_, index) => ({
        month: `${TARGET_YEAR}-${String(index + 1).padStart(2, "0")}`,
        label: monthLabelFormatter.format(new Date(TARGET_YEAR, index, 1)),
        signups: 0,
        totalPlayers: 0,
      })),
    };
  }
}

async function getRecentUsers(): Promise<UserSummary[]> {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
  `SELECT u.username, u.email, u.created_at AS createdAt
   FROM \`User\` u
   LEFT JOIN \`publisher\` p
     ON p.username = u.username
   WHERE p.username IS NULL
   ORDER BY u.created_at DESC`
    );

    return rows.map((row) => ({
      username: String(row.username ?? ""),
      email: String(row.email ?? ""),
      createdAt: row.createdAt ? String(row.createdAt) : "",
    }));
  } catch (error) {
    console.error("Failed to load users", error);
    return [];
  }
}

async function getPublishers(): Promise<PublisherSummary[]> {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT p.username, p.account_name AS accountName,
              COUNT(g.game_id) AS publishedGames
       FROM \`publisher\` p
       LEFT JOIN \`game\` g
         ON g.publisher_username = p.username
        AND g.status IN ('Approve', 'Approved', 'Published')
       GROUP BY p.username, p.account_name
       ORDER BY publishedGames DESC, p.username ASC`
    );

    return rows.map((row) => ({
      username: String(row.username ?? ""),
      accountName: row.accountName ? String(row.accountName) : null,
      publishedGames: Number(row.publishedGames ?? 0),
    }));
  } catch (error) {
    console.error("Failed to load publishers", error);
    return [];
  }
}

async function getGames(): Promise<GameSummary[]> {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT game_id AS id,
        game_name AS name,
        status,
        COALESCE(total_players, 0) AS totalPlayers
       FROM \`game\`
       ORDER BY release_date DESC
       LIMIT 16`
    );

    return rows.map((row) => ({
      id: Number(row.id ?? 0),
      name: String(row.name ?? ""),
      status: String(row.status ?? ""),
      totalPlayers: Number(row.totalPlayers ?? 0),
    }));
  } catch (error) {
    console.error("Failed to load games", error);
    return [];
  }
}

async function getPendingGames(): Promise<PendingGame[]> {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT game_id AS id,
        game_name AS name,
        publisher_username AS publisher,
        status,
        release_date AS releaseDate
       FROM \`game\`
       WHERE status = 'Pending'
       ORDER BY release_date ASC
       LIMIT 4`
    );

    return rows.map((row) => ({
      id: Number(row.id ?? 0),
      name: String(row.name ?? ""),
      publisher: String(row.publisher ?? ""),
      status: String(row.status ?? ""),
      releaseDate: row.releaseDate ? String(row.releaseDate) : null,
      formattedDate: formatDate(row.releaseDate ? String(row.releaseDate) : null),
    }));
  } catch (error) {
    console.error("Failed to load pending games", error);
    return [];
  }
}

async function getDashboardData(): Promise<DashboardData> {
  const [analytics, users, publishers, games, pendingGames] = await Promise.all([
    getSiteAnalytics(),
    getRecentUsers(),
    getPublishers(),
    getGames(),
    getPendingGames(),
  ]);

  return { analytics, users, publishers, games, pendingGames };
}

export const metadata: Metadata = {
  title: "Admin Dashboard – Y25",
  description:
    "Administrative overview for the Y25 platform including analytics, user management, and pending game reviews.",
};

export default async function AdminDashboardPage() {
  // Check authentication
  const cookieStore = await cookies();
  const adminSession = cookieStore.get("admin_session");

  if (!adminSession) {
    redirect("/admin/login");
  }

  const adminUsername = adminSession.value;

  const data = await getDashboardData();

  return (
    <div className={styles.page}>
      <header className={styles.adminHeader}>
        <div className={styles.headerLeft}>
          <span className={styles.logo}>Y25</span>
          <span className={styles.siteTitle}>/ ONLINE GAME PLATFORM</span>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.adminUsername}>{adminUsername}</span>
          <span className={styles.adminLabel}>ADMIN</span>
          <AdminLogoutButton />
        </div>
      </header>

      <main className={styles.main}>
        <section>
          <h2 className={styles.sectionHeading}>SITE ANALYTICS</h2>
          <div className={styles.analyticsGrid}>
            <div className={styles.chartCard}>
              <h3 className={styles.chartTitle}>NUMBER OF USER IN 2025</h3>
              <div className={styles.chartPlaceholder}>
                <SignupChart series={data.analytics.timeseries} />
              </div>
            </div>

            <div className={styles.statsCard}>
              <div className={styles.statRow}>
                <span className={styles.statLabel}>Number of daily users</span>
                <span className={styles.statValue}>
                  {data.analytics.dailyUsers
                    ? `${numberFormatter.format(data.analytics.dailyUsers)} users`
                    : "No recent activity"}
                </span>
              </div>
              <div className={styles.statRow}>
                <span className={styles.statLabel}>Popular games</span>
                <ol className={styles.popularList}>
                  {data.analytics.popularGames.length > 0 ? (
                    data.analytics.popularGames.map((game) => (
                      <li key={game.id}>
                        {game.name} (#{game.id}) · {numberFormatter.format(game.totalPlayers)} players
                      </li>
                    ))
                  ) : (
                    <li>No gameplay data yet</li>
                  )}
                </ol>
              </div>
              <div className={styles.statRow}>
                <span className={styles.statLabel}>Average play time</span>
                <span className={`${styles.statValue} ${styles.highlight}`}>
                  {formatAveragePlayTime(data.analytics.averagePlayTime)}
                </span>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className={styles.sectionHeading}>SIGNUP NEW USER</h2>
          <div style={{ padding: '20px', backgroundColor: '#1a1a1a', borderRadius: '8px' }}>
            <p style={{ marginBottom: '20px', color: '#ccc', fontSize: '14px' }}>
              Create a new Developer or Admin account for the platform.
            </p>
            <SignupForm />
          </div>
        </section>

        <section>
          <h2 className={styles.sectionHeading}>USER MANAGEMENT</h2>
          <div className={styles.managementGrid}>
            <ManageCardWrapper
              title="USER"
              searchPlaceholder="User name"
              emptyMessage="No users found."
              items={data.users.map((user) => ({
                id: user.username,
                primary: user.username,
                secondary: user.email,
                tertiary: `Joined ${formatDate(user.createdAt)}`,
                avatarUrl: `/api/users/${encodeURIComponent(user.username)}/avatar`,
              }))}
              apiBase="/api/users"
            />

            <ManageCardWrapper
              title="PUBLISHER"
              searchPlaceholder="Publisher name"
              emptyMessage="No publishers found."
              items={data.publishers.map((publisher) => ({
                id: publisher.username,
                primary: publisher.username,
                secondary: publisher.accountName ?? "No account name",
                tertiary: `${publisher.publishedGames} published game${
                  publisher.publishedGames === 1 ? "" : "s"
                }`,
                avatarUrl: `/api/users/${encodeURIComponent(publisher.username)}/avatar`,
              }))}
              apiBase="/api/publishers"
            />
          </div>
        </section>

        <section>
          <h2 className={styles.sectionHeading}>MANAGE GAMES</h2>
          <GamesGrid games={data.games} emptyMessage="No games available." />
        </section>

        <section>
          <h2 className={styles.sectionHeading}>PENDING GAMES</h2>
          <PendingGamesList games={data.pendingGames} />
        </section>
      </main>
    </div>
  );
}
