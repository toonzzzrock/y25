# Game Banner Image Folder Structure

## Overview

Games are stored without session_id dependency. Each game has its own folder structure containing banner images and assets.

## Folder Structure

```
/public/
├── games/
│   ├── elden_ring/
│   │   ├── banner.jpg              (Main banner image - referenced in link_to_file)
│   │   ├── images/
│   │   │   ├── screenshot1.jpg
│   │   │   ├── screenshot2.jpg
│   │   │   └── ...
│   │   └── files/
│   │       └── game_executable/ (if needed)
│   │
│   ├── cyberpunk_2077/
│   │   ├── banner.jpg
│   │   ├── images/
│   │   └── files/
│   │
│   └── [other_games]/
│       ├── banner.jpg
│       ├── images/
│       └── files/
```

## Database Schema Change

### Before (with session_id):

```sql
CREATE TABLE game (
    game_id INT NOT NULL AUTO_INCREMENT,
    game_name VARCHAR(70) NOT NULL,
    detail VARCHAR(255),
    link_to_file VARCHAR(255) NOT NULL,
    release_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    publisher_username VARCHAR(20) NOT NULL,
    session_id INT NOT NULL,  -- ❌ REMOVED
    PRIMARY KEY (game_id),
    FOREIGN KEY (publisher_username) REFERENCES publisher(username),
    FOREIGN KEY (session_id) REFERENCES session(session_id)  -- ❌ REMOVED
);
```

### After (without session_id):

```sql
CREATE TABLE game (
    game_id INT NOT NULL AUTO_INCREMENT,
    game_name VARCHAR(70) NOT NULL,
    detail VARCHAR(255),
    link_to_file VARCHAR(255) NOT NULL,     -- Points to /games/{game_name}/banner.jpg
    release_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    publisher_username VARCHAR(20) NOT NULL,
    PRIMARY KEY (game_id),
    FOREIGN KEY (publisher_username) REFERENCES publisher(username)
);
```

## File Path Convention

The `link_to_file` field should follow this format:

```
/games/{game_name_slug}/banner.jpg
```

Examples:

- `/games/elden_ring/banner.jpg`
- `/games/cyberpunk_2077/banner.jpg`
- `/games/hollow_knight/banner.jpg`

## Adding a New Game

1. Create folder structure:

```bash
mkdir -p public/games/my_new_game/images
mkdir -p public/games/my_new_game/files
```

2. Add banner image:

```bash
cp path/to/banner.jpg public/games/my_new_game/banner.jpg
```

3. Insert into database:

```sql
INSERT INTO game (game_name, detail, link_to_file, release_date, publisher_username)
VALUES (
    'My New Game',
    'Game description here',
    '/games/my_new_game/banner.jpg',
    NOW(),
    'publisher_username'
);
```

## Frontend Usage

Display game banner:

```jsx
<img src={game.link_to_file} alt={game.game_name} />
```

The path `/games/` will serve static files from the `/public/games/` directory.

## Benefits of This Structure

✅ No session dependency - games can exist independently
✅ Organized file structure - each game has its own directory
✅ Easy to manage - add/remove games without affecting sessions
✅ Scalable - can expand with more assets per game
✅ Simple URL mapping - link_to_file directly maps to public folder
