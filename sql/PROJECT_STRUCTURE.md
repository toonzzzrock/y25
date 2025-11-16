# Y25 Database - Complete SQL Structure Documentation

## Project Overview

This directory contains the complete SQL schema, stored procedures, and database configuration for the Y25 online gaming platform. The database supports user management, game publishing, forum discussions, analytics, and administrative functions.

---

## Project Structure

```
sql/
├── main.sql                    # Complete database schema and procedures
├── README.md                   # General database documentation
└── PROJECT_STRUCTURE.md        # This file
```

---

## Database Schema

### Database Name: `Y25_DB`

---

## Table Structures

### 1. User Management Tables

#### `User`

```sql
CREATE TABLE User (
    username VARCHAR(20) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_encrypted VARCHAR(255) NOT NULL,
    salt_random_value VARCHAR(255) NOT NULL,
    dob DATE,
    sex ENUM('M', 'F', 'O'),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### `publisher`

```sql
CREATE TABLE publisher (
    username VARCHAR(20) PRIMARY KEY,
    account_name VARCHAR(255),
    bank_account_serial VARCHAR(50),
    FOREIGN KEY (username) REFERENCES User(username) ON DELETE CASCADE
);
```

#### `admin`

```sql
CREATE TABLE admin (
    username VARCHAR(20) PRIMARY KEY,
    password_encrypted VARCHAR(255) NOT NULL,
    salt_random_value VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### `session`

```sql
CREATE TABLE session (
    session_id VARCHAR(255) PRIMARY KEY,
    username VARCHAR(20) NOT NULL,
    login_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    device VARCHAR(100),
    FOREIGN KEY (username) REFERENCES User(username) ON DELETE CASCADE
);
```

---

### 2. Game Management Tables

#### `game`

```sql
CREATE TABLE game (
    game_id INT AUTO_INCREMENT PRIMARY KEY,
    game_name VARCHAR(70) NOT NULL,
    detail VARCHAR(255),
    link_to_file VARCHAR(255) NOT NULL,
    release_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    status ENUM("Approve", "Reject", "Pending") DEFAULT "Pending",
    total_players INT DEFAULT 0,
    average_play_time FLOAT DEFAULT 0,
    publisher_username VARCHAR(20) NOT NULL,
    FOREIGN KEY (publisher_username) REFERENCES publisher(username) ON DELETE CASCADE
);
```

#### `game_update_history`

```sql
CREATE TABLE game_update_history (
    update_id INT AUTO_INCREMENT PRIMARY KEY,
    patch_number VARCHAR(15) NOT NULL,
    title VARCHAR(70) NOT NULL,
    detail VARCHAR(255),
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    link_to_new_file VARCHAR(255) NOT NULL,
    is_approve ENUM("Approve", "Reject", "Pending") DEFAULT "Pending",
    approve_time DATETIME,
    approve_by VARCHAR(20),
    game_id INT NOT NULL,
    FOREIGN KEY (game_id) REFERENCES game(game_id) ON DELETE CASCADE
);
```

#### `tag`

```sql
CREATE TABLE tag (
    tag_id INT AUTO_INCREMENT PRIMARY KEY,
    description VARCHAR(255) NOT NULL UNIQUE
);
```

#### `game_tag`

```sql
CREATE TABLE game_tag (
    game_id INT NOT NULL,
    tag_id INT NOT NULL,
    PRIMARY KEY (game_id, tag_id),
    FOREIGN KEY (game_id) REFERENCES game(game_id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tag(tag_id) ON DELETE CASCADE
);
```

---

### 3. Play Tracking Tables

#### `play`

```sql
CREATE TABLE play (
    username VARCHAR(20) NOT NULL,
    game_id INT NOT NULL,
    accumulated_time INT DEFAULT 0,
    PRIMARY KEY (username, game_id),
    FOREIGN KEY (username) REFERENCES User(username) ON DELETE CASCADE,
    FOREIGN KEY (game_id) REFERENCES game(game_id) ON DELETE CASCADE
);
```

---

### 4. Forum Tables

#### `forum_thread`

```sql
CREATE TABLE forum_thread (
    thread_name VARCHAR(100) PRIMARY KEY,
    detail VARCHAR(500),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    game_id INT,
    creator_username VARCHAR(20) NOT NULL,
    FOREIGN KEY (game_id) REFERENCES game(game_id) ON DELETE SET NULL,
    FOREIGN KEY (creator_username) REFERENCES User(username) ON DELETE CASCADE
);
```

#### `comment`

```sql
CREATE TABLE comment (
    comment_id INT AUTO_INCREMENT PRIMARY KEY,
    comment_text TEXT NOT NULL,
    commented_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    username VARCHAR(20) NOT NULL,
    FOREIGN KEY (username) REFERENCES User(username) ON DELETE CASCADE
);
```

#### `reply`

```sql
CREATE TABLE reply (
    reply_id INT AUTO_INCREMENT PRIMARY KEY,
    thread_name VARCHAR(100) NOT NULL,
    comment_id INT NOT NULL,
    reply_to_comment_id INT,
    FOREIGN KEY (thread_name) REFERENCES forum_thread(thread_name) ON DELETE CASCADE,
    FOREIGN KEY (comment_id) REFERENCES comment(comment_id) ON DELETE CASCADE,
    FOREIGN KEY (reply_to_comment_id) REFERENCES comment(comment_id) ON DELETE SET NULL
);
```

---

### 5. Reporting Tables

#### `game_report_topic`

```sql
CREATE TABLE game_report_topic (
    topic_id INT AUTO_INCREMENT PRIMARY KEY,
    topic_name VARCHAR(100) NOT NULL UNIQUE
);
```

#### `game_report`

```sql
CREATE TABLE game_report (
    report_id INT AUTO_INCREMENT PRIMARY KEY,
    detail TEXT NOT NULL,
    reported_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    topic_id INT NOT NULL,
    game_id INT NOT NULL,
    username VARCHAR(20) NOT NULL,
    FOREIGN KEY (topic_id) REFERENCES game_report_topic(topic_id),
    FOREIGN KEY (game_id) REFERENCES game(game_id) ON DELETE CASCADE,
    FOREIGN KEY (username) REFERENCES User(username) ON DELETE CASCADE
);
```

---

## Stored Procedures

### User Management Procedures

#### Authentication

- `sp_validate_login_fetch(username)` - Get user credentials for login validation
- `sp_insert_session(session_id, username, device)` - Create new session
- `sp_check_username(username)` - Check if username exists
- `sp_check_email(email)` - Check if email exists
- `sp_register_user_with_optional_publisher(...)` - Register user with optional publisher account

#### Profile Management

- `sp_get_user_profile(username)` - Get user profile information
- `sp_update_user_profile(username, email, dob, sex)` - Update user profile
- `sp_search_users(search_term)` - Search users by username/email

#### Analytics

- `sp_get_user_total_playtime(username)` - Get total playtime
- `sp_get_user_playtime(username)` - Get top 5 games with playtime

---

### Game Management Procedures

#### Game Operations

- `sp_create_game(name, detail, link, publisher)` - Create new game
- `sp_get_games_list(limit, offset, publisher)` - List games with pagination
- `sp_count_games(publisher)` - Count total games
- `sp_get_game_detail(game_id)` - Get game details
- `sp_update_game_details(game_id, name, detail, publisher)` - Update game info
- `sp_delete_game(game_id, publisher)` - Delete game

#### Game Discovery

- `sp_get_trending_games(limit)` - Get games by player count
- `sp_get_new_games(limit, offset)` - Get recently released games
- `sp_count_new_games()` - Count new games
- `sp_search_games(query, tag)` - Search games by name/tag

#### Game Versions

- `sp_get_game_versions(game_id)` - Get all game versions
- `sp_get_latest_game_update(game_id)` - Get latest update
- `sp_publisher_submit_game_update(...)` - Submit new game version
- `sp_game_add_initial_update(game_id, link)` - Add initial version

#### Tags

- `sp_get_game_tags(game_id)` - Get game category tags
- `sp_get_games_by_tag(tag_id, limit, offset)` - Get games by category
- `sp_count_games_by_tag(tag_id)` - Count games in category

---

### Publisher Procedures

- `sp_get_publisher_info(username)` - Get publisher profile
- `sp_get_publisher_games(username)` - Get publisher's games with metrics
- `sp_get_publisher_reports(username, game_id, topic, limit, offset)` - Get bug reports
- `sp_count_publisher_reports(username, game_id, topic)` - Count reports

---

### Forum Procedures

#### Thread Management

- `sp_create_forum_thread(name, detail, creator, game_id)` - Create thread
- `sp_get_forum_threads(limit, offset)` - List threads
- `sp_get_thread_details(thread_name)` - Get thread info
- `sp_check_thread_exists(thread_name)` - Check if thread exists
- `sp_search_forum_threads(query, game_id)` - Search threads

#### Comments & Replies

- `sp_create_comment(text, username)` - Create comment
- `sp_create_reply(thread, comment_id, reply_to)` - Create reply
- `sp_get_thread_replies(thread_name)` - Get all thread replies
- `sp_get_user_created_threads(username)` - Get user's threads
- `sp_get_user_commented_threads(username)` - Get threads user commented on

---

### Play Tracking Procedures

- `sp_play_add_time(username, game_id, seconds)` - Record playtime

---

### Reporting Procedures

- `sp_create_game_report(game_id, topic_id, detail, username)` - Create bug report

---

### Admin Procedures

#### Authentication

- `sp_admin_validate_login(username)` - Validate admin credentials
- `sp_admin_create_account(username, password)` - Create admin account

#### Analytics

- `sp_admin_get_daily_users()` - Get daily active users
- `sp_admin_get_total_sessions()` - Get total sessions
- `sp_admin_get_average_playtime()` - Get average playtime
- `sp_admin_get_popular_games()` - Get popular games
- `sp_admin_get_signups_by_month(year)` - Get monthly signups
- `sp_admin_get_players_by_month(year)` - Get monthly player counts

#### User Management

- `sp_admin_get_recent_users()` - Get recent registrations (max 8)
- `sp_admin_ban_user(username)` - Ban user account

#### Publisher Management

- `sp_admin_get_publishers()` - Get all publishers with stats (max 8)
- `sp_admin_ban_publisher(username)` - Ban publisher account

#### Game Management

- `sp_admin_get_games()` - Get approved games (WHERE status = 'Approve', max 16)
- `sp_admin_get_pending_games()` - Get pending games (WHERE status = 'Pending', all)
- `sp_admin_update_game_status(game_id, status, admin)` - Update game status
- `sp_admin_ban_game(game_id)` - Ban/reject game

---

### Developer Procedures

- `sp_developer_validate_login(username)` - Validate developer credentials

---

## Database Users & Permissions

### Users

1. **root** - Full administrative access
2. **admin** - Admin dashboard access
3. **developer** - Developer/publisher access
4. **normal_user** - General user access

### Granted Procedures

#### Admin User

- All `sp_admin_*` procedures
- Game profile procedures
- User avatar procedures

#### Developer User

- `sp_developer_validate_login`
- Publisher-related procedures
- Game management procedures

#### Normal User

- Authentication procedures
- Profile procedures
- Forum procedures
- Play tracking procedures
- Game search/view procedures

---

## Initial Data

### Report Topics

```sql
INSERT INTO game_report_topic (topic_name) VALUES
('Bug'),
('Performance Issue'),
('Feature Request'),
('Content Issue'),
('Other');
```

### Game Categories (Tags)

```sql
INSERT INTO tag (description) VALUES
('Action'),
('Adventure'),
('RPG'),
('Strategy'),
('Puzzle'),
('Simulation'),
('Sports'),
('Racing'),
('Fighting'),
('Horror'),
('Platformer'),
('Shooter');
```

---

## Database Configuration

### Connection Parameters

```
Host: localhost
Port: 3306
Database: Y25_DB
Character Set: utf8mb4
Collation: utf8mb4_unicode_ci
```

### Users & Passwords

```
admin: PokPokPokToonFilmFirstWinner1234
developer: PokPokPokToonFilmFirstWinner1234
normal_user: [configured separately]
```

---

## Key Features

### Security

- Password encryption with salt
- Prepared statements (stored procedures)
- User role separation
- Granular permission control

### Performance

- Indexed primary and foreign keys
- Connection pooling
- Efficient queries with pagination
- Strategic use of LIMIT clauses

### Data Integrity

- Foreign key constraints with CASCADE/SET NULL
- ENUM types for status fields
- NOT NULL constraints on critical fields
- UNIQUE constraints on usernames/emails

### Scalability

- Normalized schema design
- Efficient indexing strategy
- Pagination support in procedures
- Optimized for read-heavy workloads

---

## Common Queries

### Get Total Users

```sql
SELECT COUNT(*) FROM User;
```

### Get Active Sessions

```sql
SELECT COUNT(*) FROM session
WHERE login_time > DATE_SUB(NOW(), INTERVAL 24 HOUR);
```

### Get Top Games

```sql
SELECT game_name, total_players
FROM game
WHERE status = 'Approve'
ORDER BY total_players DESC
LIMIT 10;
```

### Get Publisher Stats

```sql
SELECT p.username, p.account_name,
       COUNT(g.game_id) as game_count,
       SUM(g.total_players) as total_players
FROM publisher p
LEFT JOIN game g ON p.username = g.publisher_username
WHERE g.status = 'Approve'
GROUP BY p.username;
```

---

## Notes

- All timestamps use MySQL `CURRENT_TIMESTAMP`
- Game files stored in file system, paths in database
- Session tracking for analytics
- Cascading deletes maintain referential integrity
- Report topics predefined for consistency
- Game tags standardized for better categorization
