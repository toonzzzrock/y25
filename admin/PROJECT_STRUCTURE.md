# Y25 Admin - Complete API & Project Structure Documentation

## Project Overview

Y25 Admin is a Next.js-based administrative dashboard for the Y25 online gaming platform. It provides comprehensive tools for managing users, publishers, games, and platform analytics.

---

## Project Structure

```
admin/
├── app/
│   ├── api/                    # API Routes
│   │   ├── admin/             # Admin authentication APIs
│   │   ├── games/             # Game management APIs
│   │   ├── users/             # User management APIs
│   │   └── publishers/        # Publisher management APIs
│   ├── admin/                 # Admin Dashboard Pages
│   │   ├── page.tsx           # Main dashboard
│   │   ├── login/             # Admin login page
│   │   ├── components/        # Dashboard components
│   │   └── utils/             # Utility functions
│   ├── page.tsx               # Root page (redirects to admin)
│   ├── layout.tsx             # Root layout
│   └── globals.css            # Global styles
├── lib/
│   ├── db.ts                  # Database connection pool
│   ├── public-root.ts         # Public directory path
│   └── fallback-avatar.ts     # Avatar generation utility
├── types/
│   ├── app-modules.d.ts       # Module type definitions
│   ├── routes.d.ts            # Route type definitions
│   └── validator.ts           # Validation types
├── .env.local                 # Environment configuration
├── package.json               # Project dependencies
└── tsconfig.json              # TypeScript configuration
```

---

## API Routes Documentation

### 1. Admin Authentication APIs

#### `POST /api/admin/login`

- **Purpose**: Admin login
- **Parameters**: `{ username, password }`
- **SQL Procedures Called**:
  - `sp_admin_validate_login` - Validate admin credentials
- **Response**: `{ success, message }` + Sets `admin_session` cookie

#### `POST /api/admin/logout`

- **Purpose**: Admin logout
- **Parameters**: None (uses cookies)
- **SQL Procedures Called**: None
- **Response**: `{ success, message }` + Clears `admin_session` cookie

#### `GET /api/admin/session`

- **Purpose**: Check admin session
- **Parameters**: None
- **SQL Procedures Called**: None
- **Response**: `{ authenticated, username }`

#### `POST /api/admin/signup`

- **Purpose**: Create new admin account
- **Parameters**: `{ username, password }`
- **SQL Procedures Called**:
  - `sp_admin_create_account` - Create admin account
- **Response**: `{ success, message }`

---

### 2. Game Management APIs

#### `GET /api/games/[id]/profile`

- **Purpose**: Get game profile image
- **Parameters**: `id` (URL param)
- **SQL Procedures Called**: None (file-based)
- **File Path**: `PUBLIC_ROOT/data/game/{id}/game_profile.*`
- **Response**: Game profile image (jpg, png, svg, etc.)

#### `PATCH /api/games/[id]/status`

- **Purpose**: Update game approval status
- **Parameters**: `id` (URL param), Body: `{ status: "Approve" | "Reject" | "Pending" }`
- **SQL Procedures Called**:
  - `sp_admin_update_game_status` - Update game status
- **Response**: `{ success, message }`

#### `POST /api/games/[id]/ban`

- **Purpose**: Ban/reject a game
- **Parameters**: `id` (URL param)
- **SQL Procedures Called**:
  - `sp_admin_ban_game` - Ban game
- **Response**: `{ success, message }`

---

### 3. User Management APIs

#### `GET /api/users/[username]/avatar`

- **Purpose**: Get user avatar/profile image
- **Parameters**: `username` (URL param)
- **SQL Procedures Called**: None (file-based)
- **File Path**: `PUBLIC_ROOT/data/user/{username}/user_profile.*`
- **Fallback**: Generated SVG with user initials
- **Response**: User avatar image

#### `POST /api/users/[username]/ban`

- **Purpose**: Ban a user account
- **Parameters**: `username` (URL param)
- **SQL Procedures Called**:
  - `sp_admin_ban_user` - Ban user
- **Response**: `{ success, message }`

---

### 4. Publisher Management APIs

#### `POST /api/publishers/[username]/ban`

- **Purpose**: Ban a publisher account
- **Parameters**: `username` (URL param)
- **SQL Procedures Called**:
  - `sp_admin_ban_publisher` - Ban publisher
- **Response**: `{ success, message }`

---

## Admin Dashboard Components

### Main Dashboard (`app/admin/page.tsx`)

**Purpose**: Display platform analytics and management tools

**Data Fetched**:

- Site analytics (daily users, average playtime)
- Recent users list
- Publishers list
- Games list (approved games)
- Pending games (awaiting review)
- Signup trends by month
- Popular games

**SQL Procedures Called**:

- `sp_admin_get_daily_users` - Get daily active users
- `sp_admin_get_total_sessions` - Get total sessions (fallback)
- `sp_admin_get_average_playtime` - Get average playtime
- `sp_admin_get_popular_games` - Get popular games
- `sp_admin_get_signups_by_month` - Get monthly signups
- `sp_admin_get_players_by_month` - Get monthly player count
- `sp_admin_get_recent_users` - Get recent user registrations
- `sp_admin_get_publishers` - Get all publishers
- `sp_admin_get_games` - Get approved games (max 16)
- `sp_admin_get_pending_games` - Get pending games (all)

**Sections**:

1. **Site Analytics**
   - Daily Users
   - Average Playtime
   - Monthly Signup Chart
   - Popular Games
2. **User Management**
   - Search and ban users
   - View user details
3. **Publisher Management**
   - Search and ban publishers
   - View published games count
4. **Manage Games**
   - View approved games
   - Ban games
   - Search by ID or name
5. **Pending Games**
   - Review pending submissions
   - Approve or reject games

### Dashboard Components

#### `ManageCard.tsx`

- **Purpose**: Generic management card with search and ban functionality
- **Features**: Search, filter, ban action
- **Used for**: Users, Publishers

#### `GamesGrid.tsx`

- **Purpose**: Display approved games grid
- **Features**: Search by ID/name, ban games, display thumbnails

#### `PendingGamesList.tsx`

- **Purpose**: Display and manage pending game submissions
- **Features**: Approve/reject games, real-time updates

#### `SignupChart.tsx`

- **Purpose**: Display monthly signup trends
- **Features**: Line chart visualization

#### `SignupForm.tsx`

- **Purpose**: Create new admin accounts
- **Features**: Form validation, password confirmation

#### `AdminLogoutButton.tsx`

- **Purpose**: Admin logout functionality
- **Features**: Logout with redirect

---

## Database Connection

### File: `lib/db.ts`

**Purpose**: Manages MySQL connection pool for all API routes.

**Configuration** (from `.env.local`):

```env
MYSQL_HOST=localhost
MYSQL_USER=admin
MYSQL_PASSWORD=PokPokPokToonFilmFirstWinner1234
MYSQL_DATABASE=Y25_DB
MYSQL_CONNECTION_LIMIT=10
```

**Export**:

```typescript
export const pool = mysql.createPool({...})
export async function callProcedure<T>(procedureName: string, params?: any[]): Promise<T[]>
```

---

## Core SQL Procedures Summary

### Admin Authentication

- `sp_admin_validate_login` - Validate admin credentials
- `sp_admin_create_account` - Create new admin account

### Analytics & Dashboard

- `sp_admin_get_daily_users` - Get daily active users count
- `sp_admin_get_total_sessions` - Get total session count
- `sp_admin_get_average_playtime` - Calculate average playtime
- `sp_admin_get_popular_games` - Get games by player count
- `sp_admin_get_signups_by_month` - Get monthly signup statistics
- `sp_admin_get_players_by_month` - Get monthly player statistics

### User Management

- `sp_admin_get_recent_users` - Get recently registered users
- `sp_admin_ban_user` - Ban a user account

### Publisher Management

- `sp_admin_get_publishers` - Get all publishers with stats
- `sp_admin_ban_publisher` - Ban a publisher account

### Game Management

- `sp_admin_get_games` - Get approved games (WHERE status = 'Approve', LIMIT 16)
- `sp_admin_get_pending_games` - Get pending games (WHERE status = 'Pending')
- `sp_admin_update_game_status` - Update game approval status
- `sp_admin_ban_game` - Ban/reject a game

---

## Public Asset Management

### File: `lib/public-root.ts`

**Purpose**: Define path to shared public directory

```typescript
export const PUBLIC_ROOT = path.join(process.cwd(), "..", "public");
```

**Asset Structure**:

```
public/
├── data/
│   ├── game/
│   │   └── {game_id}/
│   │       ├── game_profile.{ext}
│   │       └── game_version/
│   │           └── {version}/
│   └── user/
│       └── {username}/
│           ├── user_profile.{ext}
│           └── description.txt
└── images/
    └── placeholder.svg
```

---

## Environment Variables

Located in `.env.local`:

```env
# Database Configuration
MYSQL_HOST=localhost
MYSQL_USER=admin
MYSQL_PASSWORD=PokPokPokToonFilmFirstWinner1234
MYSQL_DATABASE=Y25_DB
MYSQL_CONNECTION_LIMIT=10
```

---

## Authentication Flow

1. Admin enters credentials at `/admin/login`
2. `POST /api/admin/login` validates credentials via `sp_admin_validate_login`
3. On success, sets `admin_session` cookie with username
4. Dashboard checks cookie on load
5. Protected routes verify `admin_session` cookie
6. Logout clears cookie via `POST /api/admin/logout`

---

## Key Features

### Dynamic Rendering

- Dashboard uses `export const dynamic = 'force-dynamic'`
- Ensures fresh data on every page load
- No caching of sensitive admin data

### Image Handling

- User avatars: `/api/users/{username}/avatar`
- Game profiles: `/api/games/{id}/profile`
- Fallback SVG generation for missing images
- ETag and Last-Modified headers for cache validation
- Short cache time (5 minutes) for profile images

### Security

- Session-based authentication with HTTP-only cookies
- Admin-only access to all routes
- Redirect to login if unauthenticated
- SQL injection prevention via parameterized procedures

---

## Key Technologies

- **Framework**: Next.js 16 with App Router (Turbopack)
- **Database**: MySQL with mysql2/promise
- **Authentication**: Cookie-based sessions
- **API Style**: RESTful
- **Styling**: CSS Modules
- **Type Safety**: TypeScript
- **Charts**: Custom SVG-based charts

---

## File Mapping Quick Reference

| Component           | Files                       |
| ------------------- | --------------------------- |
| Admin Auth APIs     | `app/api/admin/*`           |
| Game APIs           | `app/api/games/[id]/*`      |
| User APIs           | `app/api/users/[username]/*`|
| Publisher APIs      | `app/api/publishers/*`      |
| Dashboard           | `app/admin/page.tsx`        |
| Dashboard Components| `app/admin/components/*`    |
| Database            | `lib/db.ts`                 |
| Public Assets       | `lib/public-root.ts`        |

---

## Development Notes

- Admin server runs on port 3001 (default)
- Shared public directory with home-page and developer projects
- All stored procedures prefixed with `sp_admin_`
- Dashboard displays max 16 approved games
- Pending games show all without limit
- User/Publisher lists support search and filtering
- Real-time updates after approve/reject/ban actions
