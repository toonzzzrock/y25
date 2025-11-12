-- Game insertion script with folder structure for banner images
-- Each game should have its own folder in /public/games/{game_name}/ containing banner image

USE Y25_DB;

-- Example game insertions
-- Folder structure:
-- /public/games/game_name/banner.jpg
-- /public/games/game_name/images/

INSERT INTO game (game_name, detail, link_to_file, release_date, publisher_username) VALUES
('Elden Ring', 'Action RPG with open world exploration', '/games/elden_ring/banner.jpg', '2022-02-25', 'publisher1'),
('Cyberpunk 2077', 'Futuristic action RPG in Night City', '/games/cyberpunk_2077/banner.jpg', '2020-12-10', 'publisher2'),
('The Legend of Zelda: Breath of the Wild', 'Adventure game with exploration and puzzles', '/games/zelda_botw/banner.jpg', '2017-03-03', 'publisher3'),
('Stardew Valley', 'Relaxing farming simulation game', '/games/stardew_valley/banner.jpg', '2016-02-26', 'publisher4'),
('Hollow Knight', 'Indie metroidvania platformer', '/games/hollow_knight/banner.jpg', '2017-02-24', 'publisher5'),
('Hades', 'Roguelike action game with story', '/games/hades/banner.jpg', '2020-09-17', 'publisher1'),
('Baldur\'s Gate 3', 'Turn-based RPG with rich story', '/games/baldurs_gate_3/banner.jpg', '2023-08-03', 'publisher2'),
('Minecraft', 'Block-based sandbox game', '/games/minecraft/banner.jpg', '2011-11-18', 'publisher3');

-- Folder structure notes:
-- Each game folder contains:
-- - banner.jpg (main game banner image, used for link_to_file)
-- - images/ (additional game screenshots)
-- - files/ (game files if applicable)

-- Example queries:
-- SELECT * FROM game;
-- SELECT game_id, game_name, link_to_file, publisher_username FROM game;
