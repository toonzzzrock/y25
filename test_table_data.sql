CREATE database IF NOT EXISTS Y25_DB;
USE Y25_DB;

CREATE TABLE IF NOT EXISTS User (
    username VARCHAR(20) NOT NULL,
    password_encrypted VARCHAR(255) NOT NULL,
    salt_random_value VARBINARY(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    DOB DATE NOT NULL,
    sex enum('Male', 'Female', 'Other') NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    constraint PK_User PRIMARY KEY (username),
    UNIQUE KEY email (email)
);

CREATE TABLE IF NOT EXISTS session (
    session_id INT NOT NULL AUTO_INCREMENT,
    username VARCHAR(20) NOT NULL,
    last_login_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    device VARCHAR(50) NOT NULL,
    constraint PK_Session PRIMARY KEY (session_id),
    constraint FK_Session_User FOREIGN KEY (username) REFERENCES User(username) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS developer (
    username VARCHAR(20) NOT NULL,
    role enum('Tester', 'Designer', 'Programmer') NOT NULL,
    contact VARCHAR(255) NOT NULL,
    constraint PK_Developers PRIMARY KEY (username),
    constraint FK_Developer_User FOREIGN KEY (username) REFERENCES User(username) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS publisher (
    username VARCHAR(20) NOT NULL,
    account_name VARCHAR(70),
    bank_account_serial VARCHAR(64),
    constraint PK_Publisher PRIMARY KEY (username),
    constraint FK_Publisher_User FOREIGN KEY (username) REFERENCES User(username) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS admin (
    username VARCHAR(20) NOT NULL,
    constraint PK_Admin PRIMARY KEY (username),
    constraint FK_Admin_User FOREIGN KEY (username) REFERENCES User(username) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS game (
    game_id INT NOT NULL AUTO_INCREMENT,
    game_name VARCHAR(70) NOT NULL,
    detail VARCHAR(255),
    link_to_file VARCHAR(255) NOT NULL,
    release_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status enum("Published", "Decline", "Pending"),
    live_players INT DEFAULT 0,
    publisher_username VARCHAR(20) NOT NULL,
    constraint PK_Game PRIMARY KEY (game_id),
    constraint FK_Game_Publisher FOREIGN KEY (publisher_username) REFERENCES publisher(username)
);

CREATE TABLE IF NOT EXISTS game_update_history (
    update_id INT NOT NULL AUTO_INCREMENT,
    patch_number VARCHAR(15) NOT NULL,
    title VARCHAR(70) NOT NULL,
    detail VARCHAR(255),
    update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    link_to_new_file VARCHAR(255) NOT NULL,
    is_approve BOOLEAN NOT NULL DEFAULT FALSE,
    approve_time DATETIME,
    approve_by VARCHAR(20),
    game_id INT NOT NULL,
    constraint PK_Game_Update_History PRIMARY KEY (update_id),
    constraint FK_Game_Update_History_Game FOREIGN KEY (game_id) REFERENCES game(game_id),
    constraint FK_Game_Update_History_Admin FOREIGN KEY (approve_by) REFERENCES admin(username)
);

CREATE TABLE IF NOT EXISTS forum (
    thread_name VARCHAR(70) NOT NULL,
    detail VARCHAR(255),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    comment_count INT DEFAULT 0,
    unique_users INT DEFAULT 0,
    constraint PK_Forum PRIMARY KEY (thread_name)
);

CREATE TABLE IF NOT EXISTS comment (
    comment_id INT NOT NULL AUTO_INCREMENT,
    comment_text VARCHAR(255) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    constraint PK_Comment PRIMARY KEY (comment_id)
);

CREATE TABLE IF NOT EXISTS reply (
    thread_name VARCHAR(70) NOT NULL,
    username VARCHAR(20) NOT NULL,
    comment_id INT NOT NULL,
    reply_to_comment_id INT,
    constraint PK_Reply PRIMARY KEY (thread_name, username, comment_id),
    constraint FK_Reply_Forum FOREIGN KEY (thread_name) REFERENCES forum(thread_name) ON DELETE CASCADE,
    constraint FK_Reply_User FOREIGN KEY (username) REFERENCES User(username), -- ON DELETE CASCADE???
    constraint FK_Reply_Comment FOREIGN KEY (comment_id) REFERENCES comment(comment_id) ON DELETE CASCADE,
    constraint FK_Reply_ReplyToComment FOREIGN KEY (reply_to_comment_id) REFERENCES comment(comment_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS report (
    username VARCHAR(20) NOT NULL,
    game_id INT NOT NULL,
    report_topic enum('Lag', 'Disconnect', 'Bug') NOT NULL,
    detail VARCHAR(255),
    report_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    constraint PK_Report PRIMARY KEY (username, game_id),
    constraint FK_Report_User FOREIGN KEY (username) REFERENCES User(username) ON DELETE CASCADE,
    constraint FK_Report_Game FOREIGN KEY (game_id) REFERENCES game(game_id) -- ???ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS play (
    username VARCHAR(20) NOT NULL,
    game_id INT NOT NULL,
    accumulate_play_time INT NOT NULL,
    constraint PK_Play PRIMARY KEY (username, game_id),
    constraint FK_Play_User FOREIGN KEY (username) REFERENCES User(username) ON DELETE CASCADE,
    constraint FK_Play_Game FOREIGN KEY (game_id) REFERENCES game(game_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tag (
    tag_name enum('Fantasy', 'RPG', 'FPS', 'MOBA', 'RTS') NOT NULL,
    game_id INT NOT NULL,
    constraint PK_Tag PRIMARY KEY (tag_name),
    constraint FK_Tag_Game FOREIGN KEY (game_id) REFERENCES game(game_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS create_relation (
    thread_name VARCHAR(70) NOT NULL,
    username VARCHAR(20) NOT NULL,
    game_id INT NOT NULL,
    constraint PK_Create_Relation PRIMARY KEY (thread_name, username, game_id),
    constraint FK_Create_Relation_Forum FOREIGN KEY (thread_name) REFERENCES forum(thread_name) ON DELETE CASCADE,
    constraint FK_Create_Relation_User FOREIGN KEY (username) REFERENCES User(username), -- ON DELETE CASCADE???
    constraint FK_Create_Relation_Game FOREIGN KEY (game_id) REFERENCES game(game_id) ON DELETE CASCADE
);



-- Insert users (at least 8 users to link roles and publishers)
INSERT INTO User (username, password_encrypted, salt_random_value, email, DOB, sex, created_at) VALUES
('john_doe', SHA2('Password!1',256), UNHEX('01'), 'john@example.com', '1990-05-15', 'Male', '2024-01-15 14:30:00'),
('jane_smith', SHA2('Secure#2',256), UNHEX('02'), 'jane@example.com', '1992-08-23', 'Female', '2024-02-20 09:45:00'),
('alex_dev', SHA2('DevPass3$',256), UNHEX('03'), 'alex@example.com', '1988-12-01', 'Other', '2024-03-10 11:20:00'),
('sarah_pub', SHA2('PubPass4%',256), UNHEX('04'), 'sarah@example.com', '1995-03-10', 'Female', '2024-03-25 16:15:00'),
('admin_user', SHA2('Admin*5',256), UNHEX('05'), 'admin@example.com', '1985-07-20', 'Male', '2024-01-01 08:00:00'),
('pub_one', SHA2('PubOne6&',256), UNHEX('06'), 'pub1@example.com', '1991-04-12', 'Other', '2024-04-01 12:00:00'),
('pub_two', SHA2('PubTwo7(',256), UNHEX('07'), 'pub2@example.com', '1989-09-09', 'Male', '2024-04-03 09:00:00'),
('pub_three', SHA2('PubThree8)',256), UNHEX('08'), 'pub3@example.com', '1993-11-11', 'Female', '2024-04-05 10:30:00');

-- Publishers (must reference existing users)
INSERT INTO publisher (username, account_name, bank_account_serial) VALUES
('sarah_pub', 'Amazing Games Studio', 'ACCT-SG-0001'),
('jane_smith', 'Creative Gaming Labs', 'ACCT-CG-0002'),
('pub_one', 'IndiePub One', 'ACCT-IP-0003'),
('pub_two', 'IndiePub Two', 'ACCT-IP-0004'),
('pub_three', 'IndiePub Three', 'ACCT-IP-0005');

-- Admins
INSERT INTO admin (username) VALUES
('admin_user');

-- Developers
INSERT INTO developer (username, role, contact) VALUES
('alex_dev', 'Programmer', '+1-555-0123'),
('john_doe', 'Designer', '+1-555-0124'),
('pub_one', 'Tester', '+1-555-0125'),
('pub_two', 'Programmer', '+1-555-0126'),
('pub_three', 'Designer', '+1-555-0127');

-- Insert games (use the provided names, cycle publishers)
INSERT INTO game (game_name, detail, link_to_file, release_date, status, live_players, publisher_username) VALUES
('Adventure Game', 'Open-world exploration', 'https://games.example.com/adventure', '2024-06-01 10:00:00', 'Published', 12, 'sarah_pub'),
('Altos Odyssey', 'Endless runner with beautiful visuals', 'https://games.example.com/altos', '2024-06-10 11:00:00', 'Published', 8, 'jane_smith'),
('Bad Ice-Cream', 'Local co-op puzzle brawler', 'https://games.example.com/bad-ice-cream', '2024-07-01 12:00:00', 'Published', 5, 'pub_one'),
('Boxing Game', 'Arcade boxing action', 'https://games.example.com/boxing', '2024-07-10 09:30:00', 'Published', 3, 'pub_two'),
('Candy Game', 'Casual match-3 candy fun', 'https://games.example.com/candy', '2024-07-20 14:00:00', 'Published', 20, 'sarah_pub'),
('Castle Game', 'Tower defense in medieval setting', 'https://games.example.com/castle', '2024-08-01 10:15:00', 'Pending', 0, 'pub_three'),
('City Game', 'City building simulator', 'https://games.example.com/city', '2024-08-15 15:00:00', 'Published', 6, 'jane_smith'),
('Dungeon Game', 'Roguelike dungeon crawler', 'https://games.example.com/dungeon', '2024-09-01 18:00:00', 'Published', 9, 'pub_one'),
('Farm Game', 'Relaxing farming sim', 'https://games.example.com/farm', '2024-09-15 10:00:00', 'Published', 4, 'pub_two'),
('Forest Game', 'Survival in a haunted forest', 'https://games.example.com/forest', '2024-10-01 12:00:00', 'Decline', 0, 'sarah_pub'),
('Fruit Ninja', 'Slice-and-dice fruit arcade', 'https://games.example.com/fruit-ninja', '2024-06-05 09:00:00', 'Published', 30, 'jane_smith'),
('Hungry Shark', 'Underwater predator arcade', 'https://games.example.com/hungry-shark', '2024-06-12 11:15:00', 'Published', 18, 'pub_one'),
('Jungle Game', 'Platformer through jungle temples', 'https://games.example.com/jungle', '2024-08-22 13:40:00', 'Published', 7, 'pub_two'),
('Mario Game', 'Classic platformer homage', 'https://games.example.com/mario', '2024-07-03 16:00:00', 'Published', 25, 'sarah_pub'),
('Pirate Game', 'Open-sea adventure', 'https://games.example.com/pirate', '2024-07-25 17:10:00', 'Published', 11, 'pub_three'),
('Plants VS Zombies', 'Tower defense with plants', 'https://games.example.com/pvz', '2024-06-20 08:20:00', 'Published', 40, 'jane_smith'),
('Racing Game', 'Arcade racing championship', 'https://games.example.com/racing', '2024-09-10 15:00:00', 'Published', 22, 'pub_two'),
('Space Shooter', '2D space shooter with upgrades', 'https://games.example.com/space-shooter', '2024-08-30 20:00:00', 'Published', 13, 'pub_one'),
('Survival Game', 'Hardcore survival sim', 'https://games.example.com/survival', '2024-10-10 21:00:00', 'Pending', 0, 'sarah_pub'),
('Underwater Game', 'Explore the deep sea', 'https://games.example.com/underwater', '2024-09-20 14:30:00', 'Published', 2, 'pub_three'),
('Winter Game', 'Snowball fights and sledding', 'https://games.example.com/winter', '2024-12-01 09:00:00', 'Pending', 0, 'jane_smith');

-- Game update history (linking to some game ids)
INSERT INTO game_update_history (patch_number, title, detail, update_time, link_to_new_file, is_approve, approve_time, approve_by, game_id) VALUES
('1.0.1', 'Bug Fix', 'Fixed minor issues', '2024-06-15 09:30:00', 'https://patches.example.com/adventure/1.0.1', TRUE, '2024-06-16 10:00:00', 'admin_user', 1),
('1.1.0', 'Content Update', 'Added new levels', '2024-07-05 12:00:00', 'https://patches.example.com/altos/1.1.0', TRUE, '2024-07-06 13:00:00', 'admin_user', 2),
('1.0.1', 'Balance Patch', 'Tuned weapons', '2024-08-05 08:00:00', 'https://patches.example.com/dungeon/1.0.1', FALSE, NULL, NULL, 8),
('2.0.0', 'Major Update', 'New game mode', '2024-09-15 10:00:00', 'https://patches.example.com/racing/2.0.0', TRUE, '2024-09-16 11:00:00', 'admin_user', 17),
('1.0.2', 'Hotfix', 'Crash fix', '2024-06-20 14:00:00', 'https://patches.example.com/fruit-ninja/1.0.2', TRUE, '2024-06-21 09:00:00', 'admin_user', 11);

-- Forum threads
INSERT INTO forum (thread_name, detail, created_at, comment_count, unique_users) VALUES
('Welcome to Adventure', 'Discuss Adventure Game here', '2024-06-02 08:15:00', 0, 0),
('Altos Tips', 'Share Altos Odyssey tips', '2024-06-11 10:30:00', 0, 0),
('Dungeon Strategies', 'Strategies for Dungeon Game', '2024-09-02 13:45:00', 0, 0),
('Racing League', 'Competitive racing discussion', '2024-09-12 16:00:00', 0, 0),
('Indie Devs', 'Talk about indie development', '2024-05-20 12:00:00', 0, 0);

-- Comments (simple table in this test file)
INSERT INTO comment (comment_text, created_at) VALUES
('Great game, loved the exploration!', '2024-06-03 16:20:00'),
('Nice update, performance improved', '2024-07-06 11:45:00'),
('Found a bug in level 3', '2024-08-06 14:30:00'),
('How to beat the boss?', '2024-09-13 09:15:00'),
('Any plans for co-op?', '2024-05-21 17:50:00');

-- Replies linking comments to forum threads and users
INSERT INTO reply (thread_name, username, comment_id, reply_to_comment_id) VALUES
('Welcome to Adventure', 'john_doe', 1, NULL),
('Altos Tips', 'jane_smith', 2, NULL),
('Dungeon Strategies', 'alex_dev', 3, NULL),
('Racing League', 'pub_one', 4, NULL),
('Indie Devs', 'pub_two', 5, NULL);

-- Create relations: who created which thread and linked to games
INSERT INTO create_relation (thread_name, username, game_id) VALUES
('Welcome to Adventure', 'sarah_pub', 1),
('Altos Tips', 'jane_smith', 2),
('Dungeon Strategies', 'pub_one', 8),
('Racing League', 'pub_two', 17),
('Indie Devs', 'pub_three', 6);

-- Play records (accumulated play time in minutes)
INSERT INTO play (username, game_id, accumulate_play_time) VALUES
('john_doe', 1, 240),
('jane_smith', 2, 180),
('alex_dev', 8, 95),
('sarah_pub', 11, 300),
('pub_one', 17, 60);

-- Tags (one per enum value)
INSERT INTO tag (tag_name, game_id) VALUES
('Fantasy', 1),
('RPG', 8),
('FPS', 17),
('MOBA', 6),
('RTS', 3),
('MOBA', 3),
('FPS', 1),
('RTS', 5),
('Fantasy', 10),
('MOBA', 10),
('FPS', 20),
('RPG', 20);

-- Reports
INSERT INTO report (username, game_id, report_topic, detail, report_time) VALUES
('john_doe', 1, 'Bug', 'Character gets stuck in corner', '2024-06-03 17:30:00'),
('jane_smith', 2, 'Lag', 'Experiencing delays in multiplayer', '2024-07-17 09:15:00'),
('alex_dev', 8, 'Disconnect', 'Random disconnections during runs', '2024-09-02 11:45:00'),
('sarah_pub', 11, 'Bug', 'Score not counted', '2024-06-06 10:00:00'),
('pub_one', 17, 'Lag', 'Server lag spikes', '2024-09-11 12:20:00');

-- Sessions (last_login_time used in this test file)
INSERT INTO session (username, last_login_time, device) VALUES
('john_doe', '2024-09-01 13:45:00', 'Windows PC'),
('jane_smith', '2024-09-02 15:30:00', 'MacBook Pro'),
('alex_dev', '2024-09-03 10:15:00', 'Linux Workstation'),
('sarah_pub', '2024-09-04 19:20:00', 'Android Tablet'),
('pub_one', '2024-09-05 14:10:00', 'iPhone');