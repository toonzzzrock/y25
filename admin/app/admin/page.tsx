import type { Metadata } from "next";
import type { RowDataPacket } from "mysql2";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { callProcedure } from "@/lib/db";
import styles from "./admin.module.css";
import { ManageCard } from "./components/ManageCard";
import { GamesGrid } from "./components/GamesGrid";
import { SignupChart } from "./components/SignupChart";
import { PendingGamesList } from "./components/PendingGamesList";
import { ManageCardWrapper } from "./components/ManageCardWrapper";
import { SignupForm } from "./components/SignupForm";
import { formatDate } from "./utils/formatters";
import { AdminLogoutButton } from "./components/AdminLogoutButton";

// Force dynamic rendering to always fetch fresh data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

type PopularGame = {
  id: number;
  name: string;
  totalPlayers: number;
};

type UserSummary = {
  username: string;
  email: string;
  createdAt: string;
  device?: string | null;
};

type PublisherSummary = {
  username: string;
  accountName: string | null;
  publishedGames: number;
  device?: string | null;
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

function formatAveragePlayTime(seconds: number): string {
  if (!seconds || seconds < 0) {
    return "0 mins";
  }

  const minutes = seconds / 60;
  
  if (minutes >= 60) {
    const hours = minutes / 60;
    return `${minutesFormatter.format(hours)} hrs`;
  }

  return `${minutesFormatter.format(minutes)} mins`;
}

async function getSiteAnalytics(): Promise<DashboardData["analytics"]> {
  try {
    const dailyRows = await callProcedure<RowDataPacket & { count?: number }>(
      'sp_admin_get_daily_users'
    );

    const dailyRow = dailyRows[0];
    let dailyUsers = Number(dailyRow?.count ?? 0);

    if (!dailyUsers) {
      const fallbackRows = await callProcedure<RowDataPacket & { count?: number }>(
        'sp_admin_get_total_sessions'
      );
      const fallbackRow = fallbackRows[0];
      dailyUsers = Number(fallbackRow?.count ?? 0);
    }

    const incomeRows = await callProcedure<RowDataPacket & { averagePlayTime?: number }>(
      'sp_admin_get_average_playtime'
    );
    const incomeRow = incomeRows[0];

    const popularRows = await callProcedure<RowDataPacket>(
      'sp_admin_get_popular_games'
    );

    const signupRows = await callProcedure<RowDataPacket>(
      'sp_admin_get_signups_by_month',
      [TARGET_YEAR]
    );

    const playerRows = await callProcedure<RowDataPacket>(
      'sp_admin_get_players_by_month',
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
    const rows = await callProcedure<RowDataPacket>(
      'sp_admin_get_recent_users'
    );

    return rows.map((row) => ({
      username: String(row.username ?? ""),
      email: String(row.email ?? ""),
      createdAt: row.createdAt ? String(row.createdAt) : "",
      device: row.device ? String(row.device) : null,
    }));
  } catch (error) {
    console.error("Failed to load users", error);
    return [];
  }
}

async function getPublishers(): Promise<PublisherSummary[]> {
  try {
    const rows = await callProcedure<RowDataPacket>(
      'sp_admin_get_publishers'
    );

    return rows.map((row) => ({
      username: String(row.username ?? ""),
      accountName: row.accountName ? String(row.accountName) : null,
      publishedGames: Number(row.publishedGames ?? 0),
      device: row.device ? String(row.device) : null,
    }));
  } catch (error) {
    console.error("Failed to load publishers", error);
    return [];
  }
}

async function getGames(): Promise<GameSummary[]> {
  try {
    const rows = await callProcedure<RowDataPacket>(
      'sp_admin_get_games'
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
    const rows = await callProcedure<RowDataPacket>(
      'sp_admin_get_pending_games'
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
                secondary: `${user.email}${user.device ? ` · ${user.device}` : ''}`,
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
                secondary: `${publisher.accountName ?? "No account name"}${publisher.device ? ` · ${publisher.device}` : ''}`,
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
