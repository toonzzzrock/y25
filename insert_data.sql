-- Insert sample data into User table
INSERT INTO User (username, password_encrypted, salt_random_value, email, DOB, sex, created_at) VALUES
('john_doe', SHA2('password123salt1', 256), UNHEX('73616C7431'), 'john@example.com', '1990-05-15', 'Male', '2024-01-15 14:30:00'),
('jane_smith', SHA2('password456salt2', 256), UNHEX('73616C7432'), 'jane@example.com', '1992-08-23', 'Female', '2024-02-20 09:45:00'),
('alex_dev', SHA2('password789salt3', 256), UNHEX('73616C7433'), 'alex@example.com', '1988-12-01', 'Other', '2024-03-10 11:20:00'),
('sarah_pub', SHA2('passwordabcsalt4', 256), UNHEX('73616C7434'), 'sarah@example.com', '1995-03-10', 'Female', '2024-03-25 16:15:00'),
('admin_user', SHA2('adminpasssalt5', 256), UNHEX('73616C7435'), 'admin@example.com', '1985-07-20', 'Male', '2024-01-01 08:00:00');

-- Insert data into session table
INSERT INTO session (username, device, start_play_time) VALUES
('john_doe', 'Windows PC', '2024-06-02 13:45:00'),      -- Playing Space Explorer after release
('jane_smith', 'MacBook Pro', '2024-07-16 15:30:00'),   -- Playing Mystery Manor after release
('alex_dev', 'Linux Workstation', '2024-09-01 10:15:00'), -- Playing Racing Champions after release
('john_doe', 'iPhone 13', '2024-06-05 19:20:00'),       -- Playing Space Explorer on mobile
('sarah_pub', 'Android Tablet', '2024-07-20 14:10:00'); -- Testing Mystery Manor after release

-- Insert data into developer table
INSERT INTO developer (username, role, contact) VALUES
('alex_dev', 'Programmer', '+1-555-0123'),
('john_doe', 'Designer', '+1-555-0124'),
('jane_smith', 'Tester', '+1-555-0125');

-- Insert data into publisher table
INSERT INTO publisher (username, account_name) VALUES
('sarah_pub', 'Amazing Games Studio'),
('jane_smith', 'Creative Gaming Labs');

-- Insert data into admin table
INSERT INTO admin (username) VALUES
('admin_user');

-- Insert data into game table
INSERT INTO game (game_name, detail, link_to_file, publisher_username, session_id, release_date) VALUES
('Space Explorer', 'An exciting space adventure game', 'https://games.example.com/space-explorer', 'sarah_pub', 1, '2024-06-01 10:00:00'),
('Mystery Manor', 'A thrilling detective game', 'https://games.example.com/mystery-manor', 'jane_smith', 2, '2024-07-15 12:00:00'),
('Racing Champions', 'High-speed racing simulation', 'https://games.example.com/racing-champions', 'sarah_pub', 3, '2024-08-30 15:00:00');

-- Insert data into game_update_history table
INSERT INTO game_update_history (patch_number, title, detail, link_to_new_file, update_time) VALUES
('1.0.1', 'Bug Fix Update', 'Fixed minor gameplay issues', 'https://patches.example.com/space-explorer/1.0.1', '2024-06-15 09:30:00'),
('2.0.0', 'Major Content Update', 'Added new levels and features', 'https://patches.example.com/mystery-manor/2.0.0', '2024-08-01 14:45:00'),
('1.1.0', 'Performance Update', 'Improved game performance', 'https://patches.example.com/racing-champions/1.1.0', '2024-09-10 11:20:00');

-- Insert data into forum table
INSERT INTO forum (thread_name, detail, created_at) VALUES
('Welcome to Space Explorer', 'Official discussion thread for Space Explorer', '2024-06-02 08:15:00'),
('Mystery Manor Strategies', 'Share your tips and tricks for Mystery Manor', '2024-07-16 10:30:00'),
('Racing Champions League', 'Competitive racing discussion', '2024-09-01 13:45:00');

-- Insert data into comment table (using hex for binary data)
INSERT INTO comment (comment_text, created_at) VALUES
(UNHEX('476F6F642067616D652121'), '2024-06-03 16:20:00'), -- "Good game!!"
(UNHEX('4E69636520757064617465'), '2024-08-02 11:45:00'), -- "Nice update"
(UNHEX('477265617420666561747572657321'), '2024-09-02 14:30:00'); -- "Great features!"

-- Insert data into reply table
INSERT INTO reply (thread_name, username, comment_id, reply_to_comment_id) VALUES
('Welcome to Space Explorer', 'john_doe', 1, NULL),
('Mystery Manor Strategies', 'jane_smith', 2, 1),
('Racing Champions League', 'alex_dev', 3, 2);

-- Insert data into report table
INSERT INTO report (username, game_id, report_topic, detail, report_time) VALUES
('john_doe', 1, 'Bug', 'Character gets stuck in corner', '2024-06-03 17:30:00'),      -- Reported after playing Space Explorer
('jane_smith', 2, 'Lag', 'Experiencing delays in multiplayer', '2024-07-17 09:15:00'), -- Reported after playing Mystery Manor
('alex_dev', 3, 'Disconnect', 'Random disconnections during races', '2024-09-02 11:45:00'); -- Reported after playing Racing Champions

-- Insert data into play table (tracking which users play which games)
INSERT INTO play (username, game_id) VALUES
('john_doe', 1),    -- John plays Space Explorer
('john_doe', 2),    -- John also plays Mystery Manor
('jane_smith', 2),  -- Jane plays Mystery Manor (her published game)
('alex_dev', 3),    -- Alex plays Racing Champions
('sarah_pub', 1),   -- Sarah plays Space Explorer (her published game)
('sarah_pub', 3);   -- Sarah plays Racing Champions (her published game)

-- Insert data into tag table (categorizing games)
INSERT INTO tag (tag_name, game_id) VALUES
('Fantasy', 1),     -- Space Explorer is a Fantasy game
('RPG', 2),         -- Mystery Manor is an RPG
('RTS', 3);         -- Racing Champions is an RTS

-- Insert data into create_relation table (linking forums to games and creators)
INSERT INTO create_relation (thread_name, username, game_id) VALUES
('Welcome to Space Explorer', 'sarah_pub', 1),        -- Sarah created thread for her game
('Mystery Manor Strategies', 'jane_smith', 2),        -- Jane created thread for her game
('Racing Champions League', 'sarah_pub', 3);          -- Sarah created thread for her game

-- Insert data into update_version_relation table (linking updates to games and publishers)
INSERT INTO update_version_relation (game_id, update_id, username) VALUES
(1, 1, 'sarah_pub'),    -- Sarah's update for Space Explorer
(2, 2, 'jane_smith'),   -- Jane's update for Mystery Manor
(3, 3, 'sarah_pub');    -- Sarah's update for Racing Champions