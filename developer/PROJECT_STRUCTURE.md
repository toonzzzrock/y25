# Y25 Developer - Complete API & Project Structure Documentation

## Project Overview

Y25 Developer is a Next.js-based developer/publisher dashboard for the Y25 online gaming platform. It provides tools for game publishers to manage their games, track analytics, and handle bug reports.

---

## Project Structure

```
developer/
├── app/
│   ├── api/                    # API Routes
│   │   ├── developer/         # Developer authentication APIs
│   │   └── track-request/     # Request tracking API
│   ├── developer/             # Developer Dashboard Pages
│   │   ├── page.tsx           # Main dashboard
│   │   ├── login/             # Developer login page
│   │   └── components/        # Dashboard components
│   ├── page.tsx               # Root page (redirects to developer)
│   ├── layout.tsx             # Root layout
│   └── globals.css            # Global styles
├── lib/
│   ├── db.ts                  # Database connection pool
│   └── public-root.ts         # Public directory path
├── types/
│   ├── routes.d.ts            # Route type definitions
│   └── validator.ts           # Validation types
├── proxy.ts                   # Proxy configuration
├── .env.local                 # Environment configuration
├── package.json               # Project dependencies
└── tsconfig.json              # TypeScript configuration
```

---

## API Routes Documentation

### 1. Developer Authentication APIs

#### `POST /api/developer/login`

- **Purpose**: Developer/Publisher login
- **Parameters**: `{ username, password }`
- **SQL Procedures Called**:
  - `sp_developer_validate_login` - Validate developer credentials
- **Response**: `{ success, message }` + Sets `developer_session` cookie

#### `POST /api/developer/logout`

- **Purpose**: Developer logout
- **Parameters**: None (uses cookies)
- **SQL Procedures Called**: None
- **Response**: `{ success, message }` + Clears `developer_session` cookie

#### `GET /api/developer/session`

- **Purpose**: Check developer session
- **Parameters**: None
- **SQL Procedures Called**: None
- **Response**: `{ authenticated, username }`

---

### 2. Request Tracking API

#### `POST /api/track-request`

- **Purpose**: Track API requests for monitoring
- **Parameters**: `{ endpoint, method, status, duration }`
- **SQL Procedures Called**: None (writes to JSON file)
- **Response**: `{ success }`

---

## Developer Dashboard

### Main Dashboard (`app/developer/page.tsx`)

**Purpose**: Display developer/publisher analytics and game management

**Features**:

1. **Game Analytics**
   - Total games published
   - Total players across all games
   - Average playtime
2. **Game Management**
   - List of published games
   - Game status (Approved/Pending/Rejected)
   - Upload new games
   - Edit existing games
3. **Bug Reports**
   - View reports for published games
   - Filter by game and topic
   - Track report status
4. **API Usage Tracking**
   - Monitor API request patterns
   - Track response times
   - Error rate monitoring

---

## Proxy Configuration

### File: `proxy.ts`

**Purpose**: Proxy requests to main home-page API server

**Configuration**:

```typescript
const HOMEPAGE_API_URL = "http://localhost:3000";
```

**Proxied Endpoints**:

- All `/api/*` requests (except `/api/developer/*` and `/api/track-request`)
- Routes to home-page server for shared functionality

---

## Database Connection

### File: `lib/db.ts`

**Purpose**: Manages MySQL connection pool for developer API routes.

**Configuration** (from `.env.local`):

```env
MYSQL_HOST=localhost
MYSQL_USER=developer
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

### Developer Authentication

- `sp_developer_validate_login` - Validate publisher credentials

### Game Management

(Proxied to home-page API)

- `sp_create_game` - Create new game
- `sp_get_publisher_games` - Get publisher's games
- `sp_update_game_details` - Update game info
- `sp_delete_game` - Delete game
- `sp_publisher_submit_game_update` - Submit game update

### Reports

(Proxied to home-page API)

- `sp_get_publisher_reports` - Get bug reports for publisher's games
- `sp_count_publisher_reports` - Count reports

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
│   └── game/
│       └── {game_id}/
│           ├── game_profile.{ext}
│           └── game_version/
│               └── {version}/
│                   ├── index.html
│                   └── [game files]
└── api-requests-tracking.json
```

---

## Environment Variables

Located in `.env.local`:

```env
# Database Configuration
MYSQL_HOST=localhost
MYSQL_USER=developer
MYSQL_PASSWORD=PokPokPokToonFilmFirstWinner1234
MYSQL_DATABASE=Y25_DB
MYSQL_CONNECTION_LIMIT=10
```

---

## Authentication Flow

1. Publisher enters credentials at `/developer/login`
2. `POST /api/developer/login` validates via `sp_developer_validate_login`
3. On success, sets `developer_session` cookie with username
4. Dashboard checks cookie on load
5. Protected routes verify `developer_session` cookie
6. Logout clears cookie via `POST /api/developer/logout`

---

## Request Tracking

### File: `public/api-requests-tracking.json`

**Purpose**: Track all API requests for monitoring and analytics

**Data Stored**:

```json
{
  "timestamp": "2025-11-16T10:30:00.000Z",
  "endpoint": "/api/games/upload",
  "method": "POST",
  "status": 200,
  "duration": 245
}
```

**Usage**:

- Monitor API performance
- Track error rates
- Analyze usage patterns
- Debug issues

---

## Proxy Architecture

### How It Works

1. Developer dashboard runs on port 3002
2. Most API calls are proxied to home-page server (port 3000)
3. Developer-specific APIs (`/api/developer/*`) handled locally
4. Shared functionality (game upload, reports, etc.) uses home-page APIs

### Benefits

- Single source of truth for shared APIs
- Consistent data across admin/developer/home-page
- Reduced code duplication
- Easier maintenance

---

## Key Features

### Game Management

- Upload new games with file support
- Edit game details (name, description)
- Submit game updates/patches
- Delete games
- View approval status

### Analytics

- Total games published
- Total players across all games
- Average playtime statistics
- Game-specific metrics

### Bug Reports

- View all reports for published games
- Filter by game
- Filter by topic
- Track report trends

### API Monitoring

- Request tracking
- Performance metrics
- Error logging

---

## Key Technologies

- **Framework**: Next.js 16 with App Router
- **Database**: MySQL with mysql2/promise
- **Authentication**: Cookie-based sessions
- **API Style**: RESTful with Proxy
- **Styling**: CSS Modules
- **Type Safety**: TypeScript

---

## File Mapping Quick Reference

| Component              | Files                      |
| ---------------------- | -------------------------- |
| Developer Auth APIs    | `app/api/developer/*`      |
| Request Tracking       | `app/api/track-request/*`  |
| Dashboard              | `app/developer/page.tsx`   |
| Dashboard Components   | `app/developer/components/*`|
| Database               | `lib/db.ts`                |
| Proxy Config           | `proxy.ts`                 |
| Public Assets          | `lib/public-root.ts`       |

---

## Development Notes

- Developer server runs on port 3002 (default)
- Most game management APIs proxied to home-page
- Shared public directory with home-page and admin projects
- Request tracking writes to JSON file for monitoring
- Publisher can only manage their own games
- All game uploads require admin approval
