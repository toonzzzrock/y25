# Y25 Design Project - Complete API & Project Structure Documentation

## Project Overview

Y25 Design is a Next.js-based admin dashboard and API server for the Y25 online gaming platform. It provides APIs for user management, game publishing, forum discussions, and analytics.

---

## Project Structure

```
y25-design/
├── app/
│   ├── api/                    # API Routes
│   │   ├── auth/              # Authentication APIs
│   │   ├── games/             # Game management APIs
│   │   ├── users/             # User profile & management APIs
│   │   ├── forum/             # Forum & discussion APIs
│   │   ├── publisher/         # Publisher dashboard APIs
│   │   ├── play/              # Game play tracking APIs
│   │   ├── items/             # Item management APIs
│   │   └── examples/          # Example APIs
│   ├── admin/                 # Admin Dashboard Pages
│   ├── page.tsx               # Root page (redirects to admin)
│   ├── layout.tsx             # Root layout
│   └── globals.css            # Global styles
├── lib/
│   ├── db.ts                  # Database connection pool
│   ├── env.ts                 # Environment variables
│   ├── auth.ts                # Authentication utilities
│   └── user-assets.ts         # User asset management
├── public/
│   ├── data/                  # Static game/user data
│   ├── images/                # Static images
│   └── *.json                 # Tracking data files
├── types/
│   └── *.d.ts                # TypeScript type definitions
├── middleware.ts              # Next.js middleware (proxy)
├── package.json               # Project dependencies
└── tsconfig.json              # TypeScript configuration
```

---

## API Routes Documentation

### 1. Authentication APIs

#### `POST /api/auth/login`

- **Purpose**: User login
- **Parameters**: `{ username, password }`
- **SQL Procedures Called**:
  - `sp_validate_login_fetch` - Fetch user credentials
  - `sp_insert_session` - Create session record
- **Response**: `{ success, message, session_id }`

#### `POST /api/auth/signup`

- **Purpose**: Create new user account
- **Parameters**: `{ username, email, password, dob, sex, is_publisher, account_name, bank_account_serial }`
- **SQL Procedures Called**:
  - `sp_check_username` - Verify username availability
  - `sp_check_email` - Verify email availability
  - `sp_register_user_with_optional_publisher` - Create user & optional publisher record
- **Response**: `{ success, username, message }`

#### `POST /api/auth/logout`

- **Purpose**: Logout user and clear session
- **Parameters**: None (uses cookies)
- **SQL Procedures Called**: None (cookie-based)
- **Response**: `{ success, message }`

#### `GET /api/auth/session`

- **Purpose**: Check current user session
- **Parameters**: None
- **SQL Procedures Called**: None
- **Response**: `{ authenticated, username }`

#### `GET /api/auth/check-username?username=<value>`

- **Purpose**: Check if username exists
- **Parameters**: `username` (query)
- **SQL Procedures Called**:
  - `sp_check_username` - Check username in database
- **Response**: `{ exists: boolean }`

#### `GET /api/auth/check-email?email=<value>`

- **Purpose**: Check if email exists
- **Parameters**: `email` (query)
- **SQL Procedures Called**:
  - `sp_check_email` - Check email in database
- **Response**: `{ exists: boolean }`

---

### 2. User Management APIs

#### `GET /api/users/profile`

- **Purpose**: Get current user profile information
- **Parameters**: None (uses session)
- **SQL Procedures Called**:
  - `sp_get_user_profile` - Fetch profile data
  - `sp_get_user_total_playtime` - Get total playtime
  - `sp_get_user_playtime` - Get top 5 games with playtime
- **Response**: `{ username, email, dob, sex, totalPlaytime, topGames }`

#### `PUT /api/users/profile`

- **Purpose**: Update user profile
- **Parameters**: `{ email, dob, sex }`
- **SQL Procedures Called**:
  - `sp_check_email_exists` - Verify new email isn't taken
  - `sp_update_user_profile` - Update profile data
- **Response**: `{ success, message }`

#### `GET /api/users/[username]/avatar`

- **Purpose**: Get user avatar image
- **Parameters**: `username` (URL param)
- **SQL Procedures Called**: None
- **Response**: Avatar image file

#### `GET /api/users/assets/[username]`

- **Purpose**: List user assets
- **Parameters**: `username` (URL param)
- **SQL Procedures Called**: None
- **Response**: List of user files/assets

#### `GET /api/users/search?q=<query>`

- **Purpose**: Search for users
- **Parameters**: `q` (query)
- **SQL Procedures Called**:
  - `sp_search_users` - Search users by username/email
- **Response**: `{ users: [{ username, email }] }`

#### `POST /api/users/profile/content`

- **Purpose**: Upload user content/profile data
- **Parameters**: FormData with file
- **SQL Procedures Called**: None
- **Response**: `{ success, filename }`

---

### 3. Game Management APIs

#### `GET /api/games`

- **Purpose**: List all games (paginated)
- **Parameters**: `limit`, `offset`, `publisher` (query)
- **SQL Procedures Called**:
  - `sp_get_games_list` - Fetch games with pagination
  - `sp_count_games` - Get total game count
- **Response**: `{ games: [], total, hasMore }`

#### `GET /api/games/all`

- **Purpose**: Get all games (no pagination)
- **Parameters**: None
- **SQL Procedures Called**:
  - `sp_get_games_list` - Fetch all games
- **Response**: `{ games: [] }`

#### `GET /api/games/trending`

- **Purpose**: Get trending games
- **Parameters**: `limit` (query)
- **SQL Procedures Called**:
  - `sp_get_trending_games` - Fetch games by player count
- **Response**: `{ games: [{ id, name, totalPlayers }] }`

#### `GET /api/games/new`

- **Purpose**: Get recently released games
- **Parameters**: `limit`, `offset` (query)
- **SQL Procedures Called**:
  - `sp_get_new_games` - Fetch new games
  - `sp_count_new_games` - Get count
- **Response**: `{ games: [], total }`

#### `GET /api/games/search?q=<query>&tag=<tag>`

- **Purpose**: Search games by name/description
- **Parameters**: `q` (query), `tag` (optional)
- **SQL Procedures Called**:
  - `sp_search_games` - Search by query and tag
- **Response**: `{ games: [] }`

#### `GET /api/games/[id]`

- **Purpose**: Get game details
- **Parameters**: `id` (URL param)
- **SQL Procedures Called**:
  - `sp_get_game_detail` - Fetch game information
- **Response**: `{ game: { id, name, description, status, totalPlayers } }`

#### `GET /api/games/[id]/profile`

- **Purpose**: Get game profile/detailed info
- **Parameters**: `id` (URL param)
- **SQL Procedures Called**:
  - `sp_get_game_detail` - Fetch game details
  - `sp_get_latest_game_update` - Get latest update/version
- **Response**: `{ id, name, detail, releaseDate, status, link }`

#### `GET /api/games/[id]/versions`

- **Purpose**: Get all game versions/updates
- **Parameters**: `id` (URL param)
- **SQL Procedures Called**:
  - `sp_get_game_versions` - Fetch all versions
- **Response**: `{ versions: [{ version, date, description, link }] }`

#### `GET /api/games/[id]/tags`

- **Purpose**: Get game category tags
- **Parameters**: `id` (URL param)
- **SQL Procedures Called**:
  - `sp_get_game_tags` - Fetch tags for game
- **Response**: `{ tags: ['RPG', 'Fantasy', ...] }`

#### `GET /api/games/category/[categoryId]`

- **Purpose**: Get games by category
- **Parameters**: `categoryId` (URL param), `limit`, `offset` (query)
- **SQL Procedures Called**:
  - `sp_get_games_by_tag` - Fetch games by category
  - `sp_count_games_by_tag` - Get count
- **Response**: `{ games: [], total }`

#### `POST /api/games/upload`

- **Purpose**: Upload new game
- **Parameters**: FormData: `{ name, detail, file, isPremium }`
- **SQL Procedures Called**:
  - `sp_create_game` - Create game record
  - `sp_game_add_initial_update` - Add initial version
- **Response**: `{ success, game_id, message }`

#### `PATCH /api/publisher/games/[id]/edit`

- **Purpose**: Edit game details (publisher only)
- **Parameters**: `id` (URL param), Body: `{ name, detail }`
- **SQL Procedures Called**:
  - `sp_update_game_details` - Update game info
- **Response**: `{ success, game_id }`

#### `DELETE /api/games/delete`

- **Purpose**: Delete a game (publisher only)
- **Parameters**: `game_id` (body)
- **SQL Procedures Called**:
  - `sp_delete_game` - Delete game and related records
- **Response**: `{ success, message }`

#### `POST /api/games/report`

- **Purpose**: Report a game bug/issue
- **Parameters**: `{ game_id, topic, detail }`
- **SQL Procedures Called**:
  - `sp_create_game_report` - Create report record
- **Response**: `{ success, report_id }`

#### `POST /api/publisher/games/[id]/versions`

- **Purpose**: Submit new game version/update (publisher only)
- **Parameters**: `id` (URL param), Body: `{ patch_number, title, detail, file }`
- **SQL Procedures Called**:
  - `sp_publisher_submit_game_update` - Create update record
- **Response**: `{ success, update_id }`

---

### 4. Forum APIs

#### `GET /api/forum/threads`

- **Purpose**: Get forum threads (paginated)
- **Parameters**: `limit`, `offset` (query)
- **SQL Procedures Called**:
  - `sp_get_forum_threads` - Fetch threads
- **Response**: `{ threads: [], hasMore }`

#### `GET /api/forum/threads/[threadName]`

- **Purpose**: Get thread details with replies
- **Parameters**: `threadName` (URL param)
- **SQL Procedures Called**:
  - `sp_get_thread_details` - Get thread info
  - `sp_get_thread_replies` - Fetch all replies
- **Response**: `{ thread: { name, detail, createdAt }, replies: [] }`

#### `POST /api/forum/threads`

- **Purpose**: Create new forum thread
- **Parameters**: `{ thread_name, detail, game_id }`
- **SQL Procedures Called**:
  - `sp_check_thread_exists` - Verify name is unique
  - `sp_create_forum_thread` - Create thread
  - `sp_create_comment` - Create initial comment
- **Response**: `{ success, thread_name }`

#### `POST /api/forum/threads/[threadName]`

- **Purpose**: Reply to forum thread
- **Parameters**: `threadName` (URL param), Body: `{ comment_text, reply_to_comment_id }`
- **SQL Procedures Called**:
  - `sp_create_comment` - Create comment record
  - `sp_create_reply` - Link reply to thread
- **Response**: `{ success, reply_id }`

#### `GET /api/forum/search?q=<query>&game_id=<id>`

- **Purpose**: Search forum threads
- **Parameters**: `q` (query), `game_id` (optional)
- **SQL Procedures Called**:
  - `sp_search_forum_threads` - Search threads
- **Response**: `{ threads: [] }`

#### `GET /api/forum/user-threads`

- **Purpose**: Get threads created by current user
- **Parameters**: None (uses session)
- **SQL Procedures Called**:
  - `sp_get_user_created_threads` - Fetch user's threads
  - `sp_get_user_commented_threads` - Fetch threads user replied to
- **Response**: `{ createdThreads: [], commentedThreads: [] }`

---

### 5. Publisher Dashboard APIs

#### `GET /api/publisher/dashboard`

- **Purpose**: Get publisher dashboard data
- **Parameters**: None (uses session)
- **SQL Procedures Called**:
  - `sp_get_publisher_info` - Get publisher profile
  - `sp_get_publisher_games` - Fetch publisher's games
  - `sp_get_publisher_reports` - Fetch bug reports
- **Response**: `{ publisher, games: [], reports: [] }`

#### `GET /api/publisher/reports`

- **Purpose**: Get bug reports for publisher's games
- **Parameters**: `game_id`, `topic`, `limit`, `offset` (query)
- **SQL Procedures Called**:
  - `sp_get_publisher_reports` - Fetch reports with filters
  - `sp_count_publisher_reports` - Get total count
- **Response**: `{ reports: [], total }`

#### `GET /api/publisher/games/[id]/version-folders`

- **Purpose**: Get version folder structure
- **Parameters**: `id` (URL param)
- **SQL Procedures Called**: None
- **Response**: Folder structure JSON

---

### 6. Play/Activity Tracking APIs

#### `POST /api/play`

- **Purpose**: Record player activity/playtime
- **Parameters**: `{ game_id, seconds }`
- **SQL Procedures Called**:
  - `sp_play_add_time` - Record play session
- **Response**: `{ success, accumulated_time }`

---

### 7. Items/Content APIs

#### `GET /api/items`

- **Purpose**: Get items list
- **Parameters**: None
- **SQL Procedures Called**: None
- **Response**: `{ items: [] }`

#### `POST /api/items`

- **Purpose**: Create new item
- **Parameters**: `{ name, description }`
- **SQL Procedures Called**: None
- **Response**: `{ success, item_id }`

#### `GET /api/items/[id]`

- **Purpose**: Get item details
- **Parameters**: `id` (URL param)
- **SQL Procedures Called**: None
- **Response**: `{ item: {} }`

#### `PUT /api/items/[id]`

- **Purpose**: Update item
- **Parameters**: `id` (URL param), Body: `{ name, description }`
- **SQL Procedures Called**: None
- **Response**: `{ success }`

#### `DELETE /api/items/[id]`

- **Purpose**: Delete item
- **Parameters**: `id` (URL param)
- **SQL Procedures Called**: None
- **Response**: `{ success }`

---

### 8. Examples/Testing APIs

#### `GET /api/examples`

- **Purpose**: Get example data/documentation
- **Parameters**: None
- **SQL Procedures Called**: None
- **Response**: Example JSON data

---

## Database Connection

### File: `lib/db.ts`

**Purpose**: Manages MySQL connection pool for all API routes.

**Configuration** (from `.env.local`):

```
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=root
MYSQL_DATABASE=Y25_DB
MYSQL_CONNECTION_LIMIT=10
MYSQL_PORT=3306
```

**Export**:

```typescript
export const pool = mysql.createPool({...})
```

---

## Core SQL Procedures Summary

### User Management

- `sp_check_username` - Verify username exists
- `sp_check_email` - Verify email exists
- `sp_validate_login_fetch` - Get user credentials for login
- `sp_insert_session` - Create session on login
- `sp_register_user_with_optional_publisher` - Register new user
- `sp_get_user_profile` - Get user profile info
- `sp_update_user_profile` - Update profile
- `sp_search_users` - Search users

### Game Management

- `sp_create_game` - Create new game
- `sp_get_games_list` - List games paginated
- `sp_get_game_detail` - Get game details
- `sp_get_trending_games` - Get popular games
- `sp_get_new_games` - Get recent games
- `sp_search_games` - Search games
- `sp_update_game_details` - Update game info
- `sp_delete_game` - Delete game
- `sp_get_game_versions` - Get game updates
- `sp_get_game_tags` - Get game categories

### Forum/Discussion

- `sp_create_forum_thread` - Create thread
- `sp_get_forum_threads` - List threads
- `sp_get_thread_details` - Get thread info
- `sp_search_forum_threads` - Search threads
- `sp_create_comment` - Create comment
- `sp_create_reply` - Reply to thread
- `sp_get_user_created_threads` - Get user's threads

### Publisher

- `sp_get_publisher_info` - Get publisher profile
- `sp_get_publisher_games` - Get publisher's games
- `sp_get_publisher_reports` - Get game reports
- `sp_publisher_submit_game_update` - Submit new version

### Analytics

- `sp_play_add_time` - Record playtime
- `sp_get_user_total_playtime` - Get total playtime
- `sp_get_user_playtime` - Get top games

---

## Environment Variables

Located in `.env.local`:

```env
# Database
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=root
MYSQL_DATABASE=Y25_DB
MYSQL_CONNECTION_LIMIT=10
MYSQL_PORT=3306

# API
NEXT_PUBLIC_API_URL=http://localhost:8000

# Security
PEPPER_KEY=5171483f1412bb4b7fc262551eafdcd917b34ed85ccb9a1342c509d1f3016e61
```

---

## Key Technologies

- **Framework**: Next.js 16 with App Router
- **Database**: MySQL with mysql2/promise
- **Authentication**: Session-based (cookies)
- **API Style**: RESTful
- **Styling**: CSS Modules
- **Type Safety**: TypeScript

---

## File Mapping Quick Reference

| Component       | Files                 |
| --------------- | --------------------- |
| Auth APIs       | `app/api/auth/*`      |
| Game APIs       | `app/api/games/*`     |
| User APIs       | `app/api/users/*`     |
| Forum APIs      | `app/api/forum/*`     |
| Publisher       | `app/api/publisher/*` |
| Database        | `lib/db.ts`           |
| Auth Utils      | `lib/auth.ts`         |
| Admin Dashboard | `app/admin/page.tsx`  |

---

## Notes

- All APIs use MySQL stored procedures for database operations
- Authentication is cookie-based with session tracking
- Publisher APIs are restricted to authenticated publishers
- Game updates require publisher approval
- Forum allows all authenticated users to participate
- Play tracking is recorded per user-game combination
