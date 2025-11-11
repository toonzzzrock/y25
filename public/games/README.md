# Game Banners and Assets

This folder contains all game-related assets organized by game name.

## Folder Structure

Each game folder should contain:

- `banner.jpg` - Main banner image (referenced in database link_to_file)
- `images/` - Additional screenshots and promotional images
- `files/` - Game files and executables (if applicable)

## Example Structure

```
games/
├── elden_ring/
│   ├── banner.jpg
│   ├── images/
│   │   ├── screenshot1.jpg
│   │   ├── screenshot2.jpg
│   │   └── cover.jpg
│   └── files/
│
├── cyberpunk_2077/
│   ├── banner.jpg
│   ├── images/
│   └── files/
│
└── [other_games]/
    ├── banner.jpg
    ├── images/
    └── files/
```

## Adding a New Game

1. Create folder with game name (snake_case):

```bash
mkdir -p public/games/game_name/images
mkdir -p public/games/game_name/files
```

2. Add banner image:

```bash
cp banner.jpg public/games/game_name/banner.jpg
```

3. Add to database:

```sql
INSERT INTO game (game_name, detail, link_to_file, release_date, publisher_username)
VALUES ('Game Name', 'Description', '/games/game_name/banner.jpg', NOW(), 'publisher_username');
```

## Image Guidelines

- **Banner Images**: 1920x1080 or similar (recommend 16:9 aspect ratio)
- **Format**: JPEG or PNG
- **File Size**: Keep banners under 2MB for optimal loading

## Access URLs

In the frontend, images can be accessed via:

```
/games/game_name/banner.jpg
/games/game_name/images/screenshot1.jpg
```

See `game_insertions.sql` for example database entries.
