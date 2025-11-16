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
    status enum("Approve", "Reject", "Pending") DEFAULT "Pending",
    total_players INT DEFAULT 0,
    average_play_time FLOAT DEFAULT 0,
    publisher_username VARCHAR(20) NOT NULL,
    constraint PK_Game PRIMARY KEY (game_id),
    constraint FK_Game_Publisher FOREIGN KEY (publisher_username) REFERENCES publisher(username) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS game_update_history (
    update_id INT NOT NULL AUTO_INCREMENT,
    patch_number VARCHAR(15) NOT NULL,
    title VARCHAR(70) NOT NULL,
    detail VARCHAR(255),
    update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    link_to_new_file VARCHAR(255) NOT NULL,
    is_approve ENUM("Approve", "Reject", "Pending") DEFAULT "Pending",
    approve_time DATETIME,
    approve_by VARCHAR(20),
    game_id INT NOT NULL,
    constraint PK_Game_Update_History PRIMARY KEY (update_id),
    constraint FK_Game_Update_History_Game FOREIGN KEY (game_id) REFERENCES game(game_id) ON DELETE CASCADE,
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
    constraint FK_Reply_User FOREIGN KEY (username) REFERENCES User(username), 
    constraint FK_Reply_Comment FOREIGN KEY (comment_id) REFERENCES comment(comment_id) ON DELETE CASCADE,
    constraint FK_Reply_ReplyToComment FOREIGN KEY (reply_to_comment_id) REFERENCES comment(comment_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS report (
    report_id INT NOT NULL AUTO_INCREMENT,
    username VARCHAR(20) NOT NULL,
    game_id INT NOT NULL,
    report_topic enum('Lag', 'Disconnect', 'Bug') NOT NULL,
    detail VARCHAR(255),
    report_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    constraint PK_Report PRIMARY KEY (report_id),
    constraint FK_Report_User FOREIGN KEY (username) REFERENCES User(username),
    constraint FK_Report_Game FOREIGN KEY (game_id) REFERENCES game(game_id) ON DELETE CASCADE
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
    tag_name enum('Fantasy', 'RPG', 'FPS', 'MOBA', 'RTS', 'Arcade', 'Platformer', 'Puzzle', 'Racing', 'Simulation', 'Survival', 'Action', 'Adventure', 'Casual', 'Horror', 'Sports', 'Strategy') NOT NULL,
    game_id INT NOT NULL,
    constraint PK_Tag PRIMARY KEY (tag_name, game_id),
    constraint FK_Tag_Game FOREIGN KEY (game_id) REFERENCES game(game_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS create_relation (
    thread_name VARCHAR(70) NOT NULL,
    username VARCHAR(20) NOT NULL,
    game_id INT NOT NULL,
    constraint PK_Create_Relation PRIMARY KEY (thread_name, username, game_id),
    constraint FK_Create_Relation_Forum FOREIGN KEY (thread_name) REFERENCES forum(thread_name) ON DELETE CASCADE,
    constraint FK_Create_Relation_User FOREIGN KEY (username) REFERENCES User(username),
    constraint FK_Create_Relation_Game FOREIGN KEY (game_id) REFERENCES game(game_id)
);

-- Stored procedures for the Next.js stack APIs
-- Compatible with MySQL 5.7

DELIMITER //

CREATE PROCEDURE sp_get_game_owner(IN p_game_id INT) -- Work
BEGIN
  SELECT game_id, game_name, publisher_username
  FROM game
  WHERE game_id = p_game_id
  LIMIT 1;
END//


CREATE PROCEDURE sp_delete_game(IN p_game_id INT) -- Work
BEGIN
  DECLARE v_exists INT DEFAULT 0;
  SELECT COUNT(*) INTO v_exists FROM game WHERE game_id = p_game_id;
  IF v_exists = 0 THEN
    SELECT CONCAT('Game id ', p_game_id, ' does not exist') AS message, 0 AS ok;
  ELSE
    START TRANSACTION;
      DELETE FROM create_relation WHERE game_id = p_game_id;
      DELETE FROM report WHERE game_id = p_game_id;
      DELETE FROM play WHERE game_id = p_game_id;
      DELETE FROM tag WHERE game_id = p_game_id;
      DELETE FROM game_update_history WHERE game_id = p_game_id;
      DELETE FROM game WHERE game_id = p_game_id;
    COMMIT;
    SELECT CONCAT('Game ', p_game_id, ' and related records deleted') AS message, 1 AS ok;
  END IF;
END//

CREATE PROCEDURE sp_publisher_exists(IN p_username VARCHAR(20)) -- Work
BEGIN
  SELECT EXISTS(SELECT 1 FROM publisher WHERE username = p_username) AS exists_flag;
END//

-- Admin approval of a game update; updates update history row and game status
CREATE PROCEDURE sp_admin_approve_game(
  IN p_update_id INT,
  IN p_admin_username VARCHAR(20),
  IN p_decision ENUM('Approve','Reject')
)
BEGIN
  DECLARE v_game_id INT;
  DECLARE v_exists INT;
  DECLARE v_is_admin INT;

  SELECT EXISTS(SELECT 1 FROM admin WHERE username = p_admin_username) INTO v_is_admin;
  IF v_is_admin = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'User is not an admin';
  END IF;

  SELECT game_id INTO v_game_id FROM game_update_history WHERE update_id = p_update_id LIMIT 1;
  IF v_game_id IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Update id not found';
  END IF;

  START TRANSACTION;
    UPDATE game_update_history
    SET is_approve = p_decision,
        approve_time = NOW(),
        approve_by = p_admin_username
    WHERE update_id = p_update_id;

    -- Reflect decision on the game main status only if currently Pending
    UPDATE game
    SET status = CASE p_decision WHEN 'Approve' THEN 'Approve' ELSE 'Reject' END
    WHERE game_id = v_game_id AND status = 'Pending';

    -- Optionally refresh aggregate player stats (if any play rows pre-exist)
    UPDATE game g
    SET total_players = (SELECT COUNT(*) FROM play WHERE game_id = g.game_id),
        average_play_time = IFNULL((SELECT AVG(accumulate_play_time) FROM play WHERE game_id = g.game_id),0)
    WHERE g.game_id = v_game_id;
  COMMIT;

  SELECT v_game_id AS game_id,
         p_update_id AS update_id,
         p_decision AS applied_status;
END//



CREATE PROCEDURE sp_create_game(
  IN p_publisher_username VARCHAR(20),
  IN p_game_name VARCHAR(70),
  IN p_detail VARCHAR(255),
  IN p_link_to_file VARCHAR(255),
  IN p_release_date DATETIME,
  IN p_status ENUM('Approve','Reject','Pending')
)
BEGIN
  DECLARE v_is_publisher INT;

  -- Validate required inputs
  IF p_game_name IS NULL OR LENGTH(TRIM(p_game_name)) = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Game name is required';
  END IF;
  IF p_detail IS NULL OR LENGTH(TRIM(p_detail)) = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Game description is required';
  END IF;
  IF p_link_to_file IS NULL OR LENGTH(TRIM(p_link_to_file)) = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Main file path is required';
  END IF;

  -- Validate publisher exists
  SELECT EXISTS(SELECT 1 FROM publisher WHERE username = p_publisher_username) INTO v_is_publisher;
  IF v_is_publisher = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Only publishers can create games';
  END IF;

  -- Ensure explicit values for all NOT NULL / tracked columns
  INSERT INTO game (game_name, detail, link_to_file, release_date, status, total_players, average_play_time, publisher_username)
  VALUES (p_game_name, p_detail, p_link_to_file, IFNULL(p_release_date, NOW()), IFNULL(p_status,'Pending'), 0, 0, p_publisher_username);
  SELECT LAST_INSERT_ID() AS game_id;
END//


CREATE PROCEDURE sp_game_add_initial_update( -- Work
  IN p_game_id INT,
  IN p_link VARCHAR(255)
)
BEGIN
  INSERT INTO game_update_history (patch_number, title, detail, link_to_new_file, game_id)
  VALUES ('0', 'init', 'init', p_link, p_game_id);
  SELECT ROW_COUNT() AS affected;
END//

CREATE PROCEDURE sp_check_username(IN p_username VARCHAR(20)) -- Work
BEGIN
  SELECT COUNT(*) AS count FROM `User` WHERE username = p_username;
END//

CREATE PROCEDURE sp_check_email(IN p_email VARCHAR(255)) -- Work
BEGIN
  SELECT COUNT(*) AS count FROM `User` WHERE email = p_email;
END//

CREATE PROCEDURE sp_validate_login_fetch(IN p_identifier VARCHAR(255)) -- Work
BEGIN
  SELECT username, password_encrypted, salt_random_value, email
  FROM `User`
  WHERE username = p_identifier OR email = p_identifier
  LIMIT 1;
END//

CREATE PROCEDURE sp_insert_session( -- Work
  IN p_username VARCHAR(20),
  IN p_device VARCHAR(50)
)
BEGIN
  DELETE FROM session WHERE username = p_username;
  INSERT INTO session (username, last_login_time, device)
  VALUES (p_username, NOW(), p_device);
  SELECT LAST_INSERT_ID() AS session_id;
END//

CREATE PROCEDURE sp_play_add_time( -- Work
  IN p_username VARCHAR(20),
  IN p_game_id INT,
  IN p_seconds INT
)
BEGIN
  INSERT INTO play (username, game_id, accumulate_play_time)
  VALUES (p_username, p_game_id, p_seconds)
  ON DUPLICATE KEY UPDATE accumulate_play_time = accumulate_play_time + VALUES(accumulate_play_time);
  SELECT ROW_COUNT() AS affected;
END//

CREATE PROCEDURE sp_register_user_with_optional_publisher( -- Maybe Work
  IN p_username VARCHAR(20),
  IN p_email VARCHAR(255),
  IN p_dob DATE,
  IN p_sex ENUM('Male','Female','Other'),
  IN p_password_encrypted VARCHAR(255),
  IN p_salt_hex VARCHAR(255),
  IN p_created_at DATETIME,
  IN p_is_publisher BOOLEAN,
  IN p_account_name VARCHAR(70),
  IN p_bank_account_serial VARCHAR(64)
)
BEGIN
  INSERT INTO `User` (username, password_encrypted, salt_random_value, email, DOB, sex, created_at)
  VALUES (p_username, p_password_encrypted, p_salt_hex, p_email, p_dob, p_sex, p_created_at);

  IF p_is_publisher THEN
    INSERT INTO publisher (username, account_name, bank_account_serial)
    VALUES (p_username, IFNULL(p_account_name, p_username), p_bank_account_serial);
  END IF;

  SELECT p_username AS username;
END//

-- Removed erroneous delimiter reset (kept original custom delimiter // for subsequent procedures)


-- Publisher dashboard procedures
CREATE PROCEDURE sp_get_publisher_info(IN p_username VARCHAR(20))
BEGIN
  SELECT username, account_name 
  FROM publisher 
  WHERE username = p_username 
  LIMIT 1;
END//

CREATE PROCEDURE sp_get_publisher_games(IN p_publisher_username VARCHAR(20))
BEGIN
  SELECT 
    g.game_id,
    g.game_name,
    g.detail,
    g.link_to_file,
    g.release_date,
    g.status AS game_status,
    g.total_players,
    g.average_play_time,
    guh.patch_number,
    guh.is_approve AS update_status
  FROM game g
  LEFT JOIN game_update_history guh ON guh.update_id = (
    SELECT guh2.update_id
    FROM game_update_history guh2
    WHERE guh2.game_id = g.game_id
    ORDER BY COALESCE(guh2.approve_time, guh2.update_time) DESC, guh2.update_id DESC
    LIMIT 1
  )
  WHERE g.publisher_username = p_publisher_username
  ORDER BY g.release_date DESC, g.game_id DESC;
END//

CREATE PROCEDURE sp_get_publisher_reports(
  IN p_publisher_username VARCHAR(20),
  IN p_game_id INT,
  IN p_topic VARCHAR(20),
  IN p_limit INT,
  IN p_offset INT
)
BEGIN
  SELECT r.report_id, r.game_id, r.username, r.report_topic, r.detail, r.report_time, g.game_name
  FROM report r
  INNER JOIN game g ON g.game_id = r.game_id
  WHERE g.publisher_username = p_publisher_username
    AND (p_game_id IS NULL OR r.game_id = p_game_id)
    AND (p_topic IS NULL OR r.report_topic = p_topic)
  ORDER BY r.report_time DESC
  LIMIT p_limit OFFSET p_offset;
END//

CREATE PROCEDURE sp_count_publisher_reports(
  IN p_publisher_username VARCHAR(20),
  IN p_game_id INT,
  IN p_topic VARCHAR(20)
)
BEGIN
  SELECT COUNT(*) AS total
  FROM report r
  INNER JOIN game g ON g.game_id = r.game_id
  WHERE g.publisher_username = p_publisher_username
    AND (p_game_id IS NULL OR r.game_id = p_game_id)
    AND (p_topic IS NULL OR r.report_topic = p_topic);
END//

-- Games list procedures
CREATE PROCEDURE sp_get_games_list(
  IN p_publisher_username VARCHAR(20),
  IN p_limit INT,
  IN p_offset INT
)
BEGIN
  IF p_publisher_username IS NOT NULL THEN
    SELECT game_id as id, game_name as title, detail as description,
           publisher_username as developer, link_to_file as image_url,
           release_date, total_players, status AS game_status
    FROM game
    WHERE publisher_username = p_publisher_username
    ORDER BY release_date DESC, game_id DESC
    LIMIT p_limit OFFSET p_offset;
  ELSE
    SELECT game_id as id, game_name as title, detail as description,
           publisher_username as developer, link_to_file as image_url,
           release_date, total_players, status AS game_status
    FROM game
    WHERE status = 'Approve'
    ORDER BY release_date DESC, game_id DESC
    LIMIT p_limit OFFSET p_offset;
  END IF;
END//

CREATE PROCEDURE sp_count_games(IN p_publisher_username VARCHAR(20))
BEGIN
  IF p_publisher_username IS NOT NULL THEN
    SELECT COUNT(*) as total FROM game WHERE publisher_username = p_publisher_username;
  ELSE
    SELECT COUNT(*) as total FROM game WHERE status = 'Approve';
  END IF;
END//

CREATE PROCEDURE sp_get_game_detail(IN p_game_id INT)
BEGIN
  SELECT game_id AS id,
         game_name AS title,
         detail AS description,
         publisher_username AS developer,
         link_to_file AS playUrl,
         release_date AS releaseDate,
         status,
         total_players,
         average_play_time
  FROM game
  WHERE game_id = p_game_id
  LIMIT 1;
END//

CREATE PROCEDURE sp_get_latest_game_update(IN p_game_id INT)
BEGIN
  SELECT link_to_new_file AS link
  FROM game_update_history
  WHERE game_id = p_game_id AND is_approve = 'Approve'
  ORDER BY COALESCE(approve_time, update_time) DESC
  LIMIT 1;
END//

CREATE PROCEDURE sp_search_games(
  IN p_query VARCHAR(255),
  IN p_tag_name VARCHAR(50)
)
BEGIN
  IF p_tag_name IS NOT NULL THEN
    SELECT DISTINCT g.game_id as id, g.game_name as title, g.detail as description,
           g.publisher_username as developer, g.link_to_file as image_url,
           g.release_date, t.tag_name as genre
    FROM game g
    INNER JOIN tag t ON t.game_id = g.game_id
    WHERE (g.game_name LIKE p_query OR g.detail LIKE p_query OR g.publisher_username LIKE p_query)
      AND g.status = 'Approve'
      AND t.tag_name = p_tag_name
    ORDER BY g.release_date DESC
    LIMIT 20;
  ELSE
    SELECT DISTINCT g.game_id as id, g.game_name as title, g.detail as description,
           g.publisher_username as developer, g.link_to_file as image_url,
           g.release_date, NULL as genre
    FROM game g
    WHERE (g.game_name LIKE p_query OR g.detail LIKE p_query OR g.publisher_username LIKE p_query)
      AND g.status = 'Approve'
    ORDER BY g.release_date DESC
    LIMIT 20;
  END IF;
END//

CREATE PROCEDURE sp_get_trending_games(IN p_limit INT)
BEGIN
  SELECT game_id as id, game_name as title, detail as description,
         publisher_username as developer, link_to_file as image_url,
         release_date, total_players
  FROM game
  WHERE status = 'Approve'
  ORDER BY total_players DESC, release_date DESC
  LIMIT p_limit;
END//

CREATE PROCEDURE sp_get_new_games(IN p_limit INT, IN p_offset INT)
BEGIN
  SELECT game_id as id, game_name as title, detail as description,
         publisher_username as developer, link_to_file as image_url,
         release_date, total_players
  FROM game
  WHERE status = 'Approve'
  ORDER BY release_date DESC, game_id DESC
  LIMIT p_limit OFFSET p_offset;
END//

CREATE PROCEDURE sp_count_new_games()
BEGIN
  SELECT COUNT(*) as total FROM game WHERE status = 'Approve';
END//

CREATE PROCEDURE sp_get_all_games(IN p_limit INT, IN p_offset INT)
BEGIN
  SELECT game_id as id, game_name as title, detail as description,
         publisher_username as developer, link_to_file as image_url,
         release_date, total_players
  FROM game
  WHERE status = 'Approve'
  ORDER BY game_id ASC
  LIMIT p_limit OFFSET p_offset;
END//

-- Game report procedures
CREATE PROCEDURE sp_check_game_exists(IN p_game_id INT)
BEGIN
  SELECT 1 FROM game WHERE game_id = p_game_id LIMIT 1;
END//

CREATE PROCEDURE sp_create_game_report(
  IN p_game_id INT,
  IN p_username VARCHAR(20),
  IN p_topic ENUM('Lag', 'Disconnect', 'Bug'),
  IN p_detail VARCHAR(255)
)
BEGIN
  INSERT INTO report (username, game_id, report_topic, detail, report_time)
  VALUES (p_username, p_game_id, p_topic, p_detail, NOW());
  SELECT LAST_INSERT_ID() AS report_id;
END//

-- Game category procedures
CREATE PROCEDURE sp_get_games_by_tag(
  IN p_tag_name VARCHAR(50),
  IN p_limit INT,
  IN p_offset INT
)
BEGIN
  SELECT DISTINCT g.game_id as id, g.game_name as title, g.detail as description,
         g.publisher_username as developer, g.link_to_file as image_url,
         g.release_date, t.tag_name as category
  FROM game g
  INNER JOIN tag t ON t.game_id = g.game_id
  WHERE t.tag_name = p_tag_name AND g.status = 'Approve'
  ORDER BY g.release_date DESC, g.game_id DESC
  LIMIT p_limit OFFSET p_offset;
END//

CREATE PROCEDURE sp_count_games_by_tag(IN p_tag_name VARCHAR(50))
BEGIN
  SELECT COUNT(DISTINCT g.game_id) as total
  FROM game g
  INNER JOIN tag t ON t.game_id = g.game_id
  WHERE t.tag_name = p_tag_name AND g.status = 'Approve';
END//

CREATE PROCEDURE sp_get_game_tags(IN p_game_id INT)
BEGIN
  SELECT tag_name
  FROM tag
  WHERE game_id = p_game_id
  ORDER BY tag_name ASC;
END//

CREATE PROCEDURE sp_get_game_versions(IN p_game_id INT)
BEGIN
  SELECT 
    patch_number AS version,
    approve_time AS approved_date,
    update_time AS created_date,
    detail AS description,
    link_to_new_file AS link_to_file_path
  FROM game_update_history
  WHERE game_id = p_game_id AND is_approve = 'Approve'
  ORDER BY approve_time DESC, update_time DESC;
END//

-- User profile procedures
CREATE PROCEDURE sp_get_user_profile(IN p_username VARCHAR(20))
BEGIN
  SELECT username, email, DOB AS dateOfBirth, sex, created_at AS createdAt
  FROM User
  WHERE username = p_username
  LIMIT 1;
END//

CREATE PROCEDURE sp_get_user_playtime(IN p_username VARCHAR(20))
BEGIN
  SELECT
    p.game_id AS gameId,
    g.game_name AS gameName,
    COALESCE(p.accumulate_play_time, 0) AS playSeconds
  FROM play p
  LEFT JOIN game g ON g.game_id = p.game_id
  WHERE p.username = p_username
  ORDER BY playSeconds DESC, p.game_id ASC
  LIMIT 5;
END//

CREATE PROCEDURE sp_get_user_total_playtime(IN p_username VARCHAR(20))
BEGIN
  SELECT COALESCE(SUM(accumulate_play_time), 0) AS totalSeconds
  FROM play
  WHERE username = p_username;
END//

CREATE PROCEDURE sp_check_email_exists(
  IN p_email VARCHAR(255),
  IN p_exclude_username VARCHAR(20)
)
BEGIN
  SELECT COUNT(*) AS count 
  FROM User 
  WHERE email = p_email AND username != p_exclude_username;
END//

CREATE PROCEDURE sp_update_user_profile(
  IN p_username VARCHAR(20),
  IN p_email VARCHAR(255),
  IN p_dob DATE,
  IN p_sex ENUM('Male', 'Female', 'Other')
)
BEGIN
  -- Validate email format (basic check)
  IF p_email NOT LIKE '%_@__%.__%' THEN
    SIGNAL SQLSTATE '45000' 
    SET MESSAGE_TEXT = 'Invalid email format.';
  END IF;
  
  -- Validate age (must be at least 13 years old)
  IF TIMESTAMPDIFF(YEAR, p_dob, CURDATE()) < 13 THEN
    SIGNAL SQLSTATE '45000' 
    SET MESSAGE_TEXT = 'User must be at least 13 years old.';
  END IF;
  
  -- Prevent future birth dates
  IF p_dob > CURDATE() THEN
    SIGNAL SQLSTATE '45000' 
    SET MESSAGE_TEXT = 'Date of birth cannot be in the future.';
  END IF;
  
  UPDATE User
  SET email = p_email, DOB = p_dob, sex = p_sex
  WHERE username = p_username;
  SELECT ROW_COUNT() AS affected;
END//

-- User search procedure
CREATE PROCEDURE sp_search_users(IN p_query VARCHAR(255))
BEGIN
  SELECT username, email
  FROM User
  WHERE username LIKE p_query OR email LIKE p_query
  ORDER BY username ASC
  LIMIT 20;
END//

-- Publisher game edit procedures
CREATE PROCEDURE sp_update_game_link(
  IN p_game_id INT,
  IN p_link_to_file VARCHAR(255)
)
BEGIN
  UPDATE game SET link_to_file = p_link_to_file WHERE game_id = p_game_id;
  SELECT ROW_COUNT() AS affected;
END//

CREATE PROCEDURE sp_update_game_details(
  IN p_game_id INT,
  IN p_game_name VARCHAR(70),
  IN p_detail VARCHAR(255)
)
BEGIN
  UPDATE game 
  SET game_name = p_game_name, detail = p_detail 
  WHERE game_id = p_game_id;
  
  INSERT INTO game_update_history (patch_number, title, detail, link_to_new_file, game_id)
  VALUES ('edit', 'Game details updated', p_detail, '', p_game_id);
  
  SELECT ROW_COUNT() AS affected;
END//

CREATE PROCEDURE sp_publisher_submit_game_update(
  IN p_game_id INT,
  IN p_game_name VARCHAR(70),
  IN p_patch_number VARCHAR(255),
  IN p_update_title VARCHAR(255),
  IN p_update_detail VARCHAR(255),
  IN p_link_to_file VARCHAR(255)
)
BEGIN
  UPDATE game
  SET game_name = p_game_name,
      link_to_file = p_link_to_file
  WHERE game_id = p_game_id;

  INSERT INTO game_update_history (patch_number, title, detail, link_to_new_file, game_id)
  VALUES (
    p_patch_number,
    IFNULL(p_update_title, p_patch_number),
    IFNULL(p_update_detail, 'Update details pending'),
    p_link_to_file,
    p_game_id
  );

  SELECT ROW_COUNT() AS affected;
END//

-- Forum procedures
CREATE PROCEDURE sp_get_forum_threads(IN p_limit INT, IN p_offset INT)
BEGIN
  SELECT thread_name, detail, created_at, comment_count, unique_users
  FROM forum
  ORDER BY created_at DESC
  LIMIT p_limit OFFSET p_offset;
END//

CREATE PROCEDURE sp_get_forum_threads_cursor(
  IN p_limit INT,
  IN p_cursor_created DATETIME,
  IN p_cursor_thread VARCHAR(70),
  IN p_search VARCHAR(255)
)
BEGIN
  DECLARE v_limit INT;
  SET v_limit = LEAST(GREATEST(p_limit, 1), 101);
  SELECT f.thread_name, f.detail, f.created_at,
         cr.username AS creator_username,
         g.game_id, g.game_name,
         COUNT(r.comment_id) AS reply_count
  FROM forum f
  LEFT JOIN create_relation cr ON cr.thread_name = f.thread_name
  LEFT JOIN game g ON g.game_id = cr.game_id
  LEFT JOIN reply r ON r.thread_name = f.thread_name
  WHERE (p_search IS NULL OR p_search = '' OR
        f.thread_name LIKE p_search OR
        f.detail LIKE p_search OR
        g.game_name LIKE p_search OR
        cr.username LIKE p_search)
    AND (p_cursor_created IS NULL OR
         (f.created_at < p_cursor_created OR
          (f.created_at = p_cursor_created AND (p_cursor_thread IS NULL OR f.thread_name < p_cursor_thread))))
  GROUP BY f.thread_name, f.detail, f.created_at, cr.username, g.game_id, g.game_name
  ORDER BY f.created_at DESC, f.thread_name DESC
  LIMIT v_limit;
END//

CREATE PROCEDURE sp_search_forum_threads(
  IN p_query VARCHAR(255),
  IN p_game_id INT,
  IN p_limit INT
)
BEGIN
  DECLARE v_limit INT;
  SET v_limit = LEAST(GREATEST(p_limit, 1), 50);

  SELECT f.thread_name, f.detail, f.created_at, f.comment_count, f.unique_users,
         cr.username AS creator_username,
         g.game_id, g.game_name,
         COUNT(r.comment_id) AS reply_count
  FROM forum f
  LEFT JOIN create_relation cr ON cr.thread_name = f.thread_name
  LEFT JOIN game g ON g.game_id = cr.game_id
  LEFT JOIN reply r ON r.thread_name = f.thread_name
  WHERE (p_query IS NULL OR p_query = '' OR
        f.thread_name LIKE p_query OR
        f.detail LIKE p_query OR
        g.game_name LIKE p_query OR
        cr.username LIKE p_query)
    AND (p_game_id IS NULL OR g.game_id = p_game_id)
  GROUP BY f.thread_name, f.detail, f.created_at, f.comment_count, f.unique_users,
           cr.username, g.game_id, g.game_name
  ORDER BY f.created_at DESC
  LIMIT v_limit;
END//

CREATE PROCEDURE sp_get_thread_details(IN p_thread_name VARCHAR(70))
BEGIN
  SELECT f.thread_name, f.detail, f.created_at, f.comment_count, f.unique_users,
         cr.username AS creator_username,
         g.game_id, g.game_name
  FROM forum f
  LEFT JOIN create_relation cr ON cr.thread_name = f.thread_name
  LEFT JOIN game g ON g.game_id = cr.game_id
  WHERE f.thread_name = p_thread_name
  LIMIT 1;
END//

CREATE PROCEDURE sp_check_thread_exists(IN p_thread_name VARCHAR(70))
BEGIN
  SELECT 1 FROM forum WHERE thread_name = p_thread_name LIMIT 1;
END//

CREATE PROCEDURE sp_get_thread_replies(IN p_thread_name VARCHAR(70))
BEGIN
  SELECT r.username, r.comment_id, r.reply_to_comment_id, c.comment_text, c.created_at
  FROM reply r
  INNER JOIN comment c ON c.comment_id = r.comment_id
  WHERE r.thread_name = p_thread_name
  ORDER BY c.created_at ASC;
END//

CREATE PROCEDURE sp_check_reply_to_comment(
  IN p_thread_name VARCHAR(70),
  IN p_comment_id INT
)
BEGIN
  SELECT r.comment_id
  FROM reply r
  WHERE r.thread_name = p_thread_name AND r.comment_id = p_comment_id
  LIMIT 1;
END//

CREATE PROCEDURE sp_create_comment(IN p_comment_text VARCHAR(255))
BEGIN
  INSERT INTO comment (comment_text, created_at)
  VALUES (p_comment_text, NOW());
  SELECT LAST_INSERT_ID() AS comment_id;
END//

CREATE PROCEDURE sp_create_reply(
  IN p_thread_name VARCHAR(70),
  IN p_username VARCHAR(20),
  IN p_comment_id INT,
  IN p_reply_to_comment_id INT
)
BEGIN
  INSERT INTO reply (thread_name, username, comment_id, reply_to_comment_id)
  VALUES (p_thread_name, p_username, p_comment_id, p_reply_to_comment_id);
  SELECT ROW_COUNT() AS affected;
END//

CREATE PROCEDURE sp_check_game_for_thread(IN p_game_id INT)
BEGIN
  SELECT game_id FROM game WHERE game_id = p_game_id AND status = 'Approve' LIMIT 1;
END//

CREATE PROCEDURE sp_create_forum_thread(
  IN p_thread_name VARCHAR(70),
  IN p_detail VARCHAR(255),
  IN p_username VARCHAR(20),
  IN p_game_id INT
)
BEGIN
  INSERT INTO forum (thread_name, detail, created_at, comment_count, unique_users)
  VALUES (p_thread_name, p_detail, NOW(), 0, 0);
  
  INSERT INTO create_relation (thread_name, username, game_id)
  VALUES (p_thread_name, p_username, p_game_id);
  
  SELECT p_thread_name AS thread_name;
END//

CREATE PROCEDURE sp_get_user_created_threads(IN p_username VARCHAR(20))
BEGIN
  SELECT f.thread_name, f.detail, f.created_at, f.comment_count, f.unique_users
  FROM forum f
  INNER JOIN create_relation cr ON cr.thread_name = f.thread_name
  WHERE cr.username = p_username
  ORDER BY f.created_at DESC
  LIMIT 20;
END//

CREATE PROCEDURE sp_get_user_commented_threads(IN p_username VARCHAR(20))
BEGIN
  SELECT DISTINCT f.thread_name, f.detail, f.created_at, f.comment_count, f.unique_users
  FROM forum f
  INNER JOIN reply r ON r.thread_name = f.thread_name
  WHERE r.username = p_username
  ORDER BY f.created_at DESC
  LIMIT 20;
END//


DELIMITER ;



-- Triggers to maintain aggregate fields on `game`
DELIMITER //

CREATE TRIGGER trg_play_after_insert -- Work
AFTER INSERT ON play
FOR EACH ROW
BEGIN
    UPDATE game
    SET total_players = (SELECT COUNT(*) FROM play WHERE game_id = NEW.game_id),
        average_play_time = IFNULL((SELECT AVG(accumulate_play_time) FROM play WHERE game_id = NEW.game_id), 0)
    WHERE game_id = NEW.game_id;
END;//

CREATE TRIGGER trg_play_after_update
AFTER UPDATE ON play
FOR EACH ROW
BEGIN
    IF OLD.game_id != NEW.game_id THEN
        -- Update aggregates for old game
        UPDATE game
        SET total_players = (SELECT COUNT(*) FROM play WHERE game_id = OLD.game_id),
            average_play_time = IFNULL((SELECT AVG(accumulate_play_time) FROM play WHERE game_id = OLD.game_id), 0)
        WHERE game_id = OLD.game_id;

        -- Update aggregates for new game
        UPDATE game
        SET total_players = (SELECT COUNT(*) FROM play WHERE game_id = NEW.game_id),
            average_play_time = IFNULL((SELECT AVG(accumulate_play_time) FROM play WHERE game_id = NEW.game_id), 0)
        WHERE game_id = NEW.game_id;
    ELSE
        -- Same game: just recalc
        UPDATE game
        SET total_players = (SELECT COUNT(*) FROM play WHERE game_id = NEW.game_id),
            average_play_time = IFNULL((SELECT AVG(accumulate_play_time) FROM play WHERE game_id = NEW.game_id), 0)
        WHERE game_id = NEW.game_id;
    END IF;
END;//

CREATE TRIGGER trg_play_after_delete -- Work
AFTER DELETE ON play
FOR EACH ROW
BEGIN
    UPDATE game
    SET total_players = (SELECT COUNT(*) FROM play WHERE game_id = OLD.game_id),
        average_play_time = IFNULL((SELECT AVG(accumulate_play_time) FROM play WHERE game_id = OLD.game_id), 0)
    WHERE game_id = OLD.game_id;
END;//

DELIMITER ;

-- Stored procedure to safely delete a game and its dependent records.
-- Simpler, MySQL 5.7 friendly version that avoids handler blocks.
-- Usage: CALL sp_delete_game(123);
DELIMITER //

CREATE TRIGGER after_reply_insert -- Work
AFTER INSERT ON reply
FOR EACH ROW
BEGIN
    -- Increment comment count
    UPDATE forum
    SET comment_count = comment_count + 1
    WHERE thread_name = NEW.thread_name;
    
    -- Count unique users for this thread directly
    UPDATE forum
    SET unique_users = (
        SELECT COUNT(DISTINCT username)
        FROM reply
        WHERE thread_name = NEW.thread_name
    )
    WHERE thread_name = NEW.thread_name;
END;//

-- Security trigger: Prevent direct User insertion without proper password hashing
-- Ensures users can only be created through stored procedures (web application)
CREATE TRIGGER trg_user_before_insert
BEFORE INSERT ON User
FOR EACH ROW
BEGIN
    
    -- Validate email format (basic check)
    IF NEW.email NOT LIKE '%_@__%.__%' THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Invalid email format.';
    END IF;
    
    -- Validate age (must be at least 13 years old)
    IF TIMESTAMPDIFF(YEAR, NEW.DOB, CURDATE()) < 13 THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'User must be at least 13 years old to register.';
    END IF;
    
    -- Prevent future birth dates
    IF NEW.DOB > CURDATE() THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Date of birth cannot be in the future.';
    END IF;
END;//

-- Security trigger: Prevent deletion of admin users
-- Ensures admins cannot be deleted from User table
CREATE TRIGGER trg_user_before_delete
BEFORE DELETE ON User
FOR EACH ROW
BEGIN
    DECLARE v_is_admin INT DEFAULT 0;
    
    -- Check if the user being deleted is an admin
    SELECT COUNT(*) INTO v_is_admin FROM admin WHERE username = OLD.username;
    
    IF v_is_admin > 0 THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Cannot delete admin users. Admin accounts are protected.';
    END IF;
END;//

DELIMITER ;

-- =================================================================================
-- FIX USER INSERTS!!
INSERT INTO User (username, password_encrypted, salt_random_value, email, DOB, sex, created_at) VALUES
('NormalAdmin', '08b3e8113def867697b3c4d0f4081319ccd15080a9e97d956d8bd13db8cbf8d5', 'b3efdea6f573ec8094fc511ce0e9e56f705c6d7720e63e2306aa6a70daaac5dd', 'NormalAdmin@gmail.com', '2003-12-29', 'Other', '2025-11-16 06:08:24'),
('NormalDev', '288a676c8632c2d4f3ef6245feb1ba03a5cea03440fed825004c8b1f4627bd27', '02ce7818f6b0086b2278b339665046d9b06a2181594588c8eb1e2cc3614d8f75', 'NormalDev@gmail.com', '2009-06-09', 'Other', '2025-11-16 13:10:51'),
('NormalPub', 'e2e32f032bd3191011ce4b49241c34e49ef18a54a9984e97618000863c6e4826', '1af87067c65f13cba5ce464348b4a48777fc225272e0292d4e2b3c5ddffe8fb0', 'NormalPub@gmail.com', '2000-06-01', 'Other', '2025-11-16 06:06:39'),
('NormalUser', '5fe84cfe3a2f86da0a1c43c16596022071dfdf247ced665cd28e232123837ee4', 'c71d8297ca0d29c0b585a0628ee1040e280426b2a103bd9c9167f0b64d4ed5b8', 'NormalUser@gmail.com', '2003-02-03', 'Male', '2025-11-16 06:05:40');

INSERT INTO admin (username) VALUES
('NormalAdmin');

INSERT INTO developer (username, role, contact) VALUES
('NormalDev', 'Programmer', '+1-555-0001');

INSERT INTO publisher (username, account_name, bank_account_serial) VALUES
('NormalPub', 'NormalPub Account', 'ACCT-NP-0001');
-- ==================================================================================

-- Insert games (use the provided names, cycle publishers)
INSERT INTO game (game_name, detail, link_to_file, publisher_username) VALUES
('Adventure Game', 'Open-world exploration', 'index.html', 'NormalPub'),
('Altos Odyssey', 'Endless runner with beautiful visuals', 'index.html', 'NormalPub'),
('Bad Ice-Cream', 'Local co-op puzzle brawler', 'index.html', 'NormalPub'),
('Boxing Game', 'Arcade boxing action', 'index.html', 'NormalPub'),
('Candy Game', 'Casual match-3 candy fun', 'index.html', 'NormalPub'),
('Castle Game', 'Tower defense in medieval setting', 'index.html', 'NormalPub'),
('City Game', 'City building simulator', 'index.html', 'NormalPub'),
('Dungeon Game', 'Roguelike dungeon crawler', 'index.html', 'NormalPub'),
('Farm Game', 'Relaxing farming sim', 'index.html', 'NormalPub'),
('Forest Game', 'Survival in a haunted forest', 'index.html', 'NormalPub'),
('Fruit Ninja', 'Slice-and-dice fruit arcade', 'index.html', 'NormalPub'),
('Hungry Shark', 'Underwater predator arcade', 'index.html', 'NormalPub'),
('Jungle Game', 'Platformer through jungle temples', 'index.html', 'NormalPub'),
('Mario Game', 'Classic platformer homage', 'index.html', 'NormalPub'),
('Pirate Game', 'Open-sea adventure', 'index.html', 'NormalPub'),
('Plants VS Zombies', 'Tower defense with plants', 'index.html', 'NormalPub'),
('Racing Game', 'Arcade racing championship', 'index.html', 'NormalPub'),
('Space Shooter', '2D space shooter with upgrades', 'index.html', 'NormalPub'),
('Survival Game', 'Hardcore survival sim', 'index.html', 'NormalPub'),
('Underwater Game', 'Explore the deep sea', 'index.html', 'NormalPub'),
('Winter Game', 'Snowball fights and sledding', 'index.html', 'NormalPub');

-- Game update history (linking to some game ids)
INSERT INTO game_update_history (patch_number, title, detail, link_to_new_file, approve_time, approve_by, game_id) VALUES
('1.0.1', 'Bug Fix', 'Fixed minor issues', 'index.html', NULL, NULL, 1),
('1.1.0', 'Content Update', 'Added new levels', 'index.html', NULL, NULL, 2),
('1.0.1', 'Balance Patch', 'Tuned weapons', 'index.html', NULL, NULL, 8),
('2.0.0', 'Major Update', 'New game mode', 'index.html', NULL, NULL, 17),
('1.0.2', 'Hotfix', 'Crash fix', 'index.html', NULL, NULL, 11);
-- Forum threads
INSERT INTO forum (thread_name, detail) VALUES
('Welcome to Adventure', 'Discuss Adventure Game here'),
('Altos Tips', 'Share Altos Odyssey tips'),
('Dungeon Strategies', 'Strategies for Dungeon Game'),
('Racing League', 'Competitive racing discussion'),
('Indie Devs', 'Talk about indie development');

-- Comments (simple table in this test file)
INSERT INTO comment (comment_text) VALUES
('Great game, loved the exploration!'),
('Nice update, performance improved'),
('Found a bug in level 3'),
('How to beat the boss?'),
('Any plans for co-op?');

-- Replies linking comments to forum threads and users
INSERT INTO reply (thread_name, username, comment_id, reply_to_comment_id) VALUES
('Welcome to Adventure', 'NormalUser', 1, NULL),
('Altos Tips', 'NormalUser', 2, NULL),
('Dungeon Strategies', 'NormalUser', 3, NULL),
('Racing League', 'NormalUser', 4, NULL),
('Indie Devs', 'NormalUser', 5, NULL);

-- Create relations: who created which thread and linked to games
INSERT INTO create_relation (thread_name, username, game_id) VALUES
('Welcome to Adventure', 'NormalUser', 1),
('Altos Tips', 'NormalUser', 2),
('Dungeon Strategies', 'NormalUser', 8),
('Racing League', 'NormalUser', 17),
('Indie Devs', 'NormalUser', 6);

-- Tags (Multivalued) - Realistic categorization based on game genres
-- Available tags: Fantasy, RPG, FPS, MOBA, RTS, Arcade, Platformer, Puzzle, Racing, Simulation, Survival, Action, Adventure, Casual, Horror, Sports, Strategy
INSERT INTO tag (tag_name, game_id) VALUES
-- Game 1: Adventure Game (Open-world exploration)
('Fantasy', 1),
('RPG', 1),
('Adventure', 1),
-- Game 2: Altos Odyssey (Endless runner with beautiful visuals)
('Arcade', 2),
('Casual', 2),
-- Game 3: Bad Ice-Cream (Local co-op puzzle brawler)
('Puzzle', 3),
('Arcade', 3),
('Action', 3),
-- Game 4: Boxing Game (Arcade boxing action)
('Sports', 4),
('Arcade', 4),
('Action', 4),
-- Game 5: Candy Game (Casual match-3 candy fun)
('Casual', 5),
('Puzzle', 5),
-- Game 6: Castle Game (Tower defense in medieval setting)
('Fantasy', 6),
('Strategy', 6),
('RTS', 6),
-- Game 7: City Game (City building simulator)
('Simulation', 7),
('Strategy', 7),
('RTS', 7),
-- Game 8: Dungeon Game (Roguelike dungeon crawler)
('Fantasy', 8),
('RPG', 8),
('Adventure', 8),
-- Game 9: Farm Game (Relaxing farming sim)
('Simulation', 9),
('Casual', 9),
-- Game 10: Forest Game (Survival in a haunted forest)
('Survival', 10),
('Horror', 10),
('Fantasy', 10),
-- Game 11: Fruit Ninja (Slice-and-dice fruit arcade)
('Arcade', 11),
('Casual', 11),
('Action', 11),
-- Game 12: Hungry Shark (Underwater predator arcade)
('Arcade', 12),
('Action', 12),
('Casual', 12),
-- Game 13: Jungle Game (Platformer through jungle temples)
('Platformer', 13),
('Adventure', 13),
('Fantasy', 13),
-- Game 14: Mario Game (Classic platformer homage)
('Platformer', 14),
('Arcade', 14),
('Action', 14),
-- Game 15: Pirate Game (Open-sea adventure)
('Adventure', 15),
('Fantasy', 15),
('Action', 15),
-- Game 16: Plants VS Zombies (Tower defense with plants)
('Strategy', 16),
('RTS', 16),
-- Game 17: Racing Game (Arcade racing championship)
('Racing', 17),
('Arcade', 17),
('Sports', 17),
-- Game 18: Space Shooter (2D space shooter with upgrades)
('FPS', 18),
('Action', 18),
('Arcade', 18),
-- Game 19: Survival Game (Hardcore survival sim)
('Survival', 19),
('Simulation', 19),
-- Game 20: Underwater Game (Explore the deep sea)
('Adventure', 20),
('Simulation', 20),
('Casual', 20),
-- Game 21: Winter Game (Snowball fights and sledding)
('Casual', 21),
('Sports', 21),
('Action', 21);

-- Reports
INSERT INTO report (username, game_id, report_topic, detail) VALUES
('NormalUser', 1, 'Bug', 'Character gets stuck in corner'),
('NormalUser', 2, 'Lag', 'Experiencing delays in multiplayer'),
('NormalUser', 8, 'Disconnect', 'Random disconnections during runs'),
('NormalUser', 11, 'Bug', 'Score not counted'),
('NormalUser', 17, 'Lag', 'Server lag spikes');

USE Y25_DB;

DELIMITER //
-- Admin-specific procedures
CREATE PROCEDURE sp_admin_validate_login(IN p_username VARCHAR(20))
BEGIN
  SELECT u.username, u.password_encrypted, u.salt_random_value
  FROM User u
  WHERE u.username = p_username
  LIMIT 1;
END//

CREATE PROCEDURE sp_admin_check_privileges(IN p_username VARCHAR(20))
BEGIN
  SELECT username FROM admin WHERE username = p_username LIMIT 1;
END//

CREATE PROCEDURE sp_admin_check_user_exists(
  IN p_username VARCHAR(20),
  IN p_email VARCHAR(255)
)
BEGIN
  SELECT username FROM User WHERE username = p_username OR email = p_email LIMIT 1;
END//

CREATE PROCEDURE sp_admin_create_user(
  IN p_username VARCHAR(20),
  IN p_password_encrypted VARCHAR(255),
  IN p_salt_hex VARCHAR(255),
  IN p_email VARCHAR(255),
  IN p_dob DATE,
  IN p_sex ENUM('Male','Female','Other')
)
BEGIN
  INSERT INTO User (username, password_encrypted, salt_random_value, email, DOB, sex)
  VALUES (p_username, p_password_encrypted, p_salt_hex, p_email, p_dob, p_sex);
  SELECT LAST_INSERT_ID() AS user_id, p_username AS username;
END//

CREATE PROCEDURE sp_admin_create_developer(
  IN p_username VARCHAR(20),
  IN p_contact VARCHAR(255),
  IN p_role ENUM('Tester', 'Designer', 'Programmer')
)
BEGIN
  INSERT INTO developer (username, role, contact)
  VALUES (p_username, IFNULL(p_role, 'Programmer'), p_contact);
  SELECT ROW_COUNT() AS affected;
END//

CREATE PROCEDURE sp_admin_ban_user(IN p_username VARCHAR(20))
BEGIN
  DECLARE v_exists INT DEFAULT 0;
  DECLARE v_is_admin INT DEFAULT 0;
  
  SELECT COUNT(*) INTO v_exists FROM User WHERE username = p_username;
  SELECT COUNT(*) INTO v_is_admin FROM admin WHERE username = p_username;
  
  IF v_exists = 0 THEN
    SELECT 0 AS affected, 'User not found' AS message;
  ELSEIF v_is_admin > 0 THEN
    SELECT 0 AS affected, 'Cannot ban admin users' AS message;
  ELSE
    START TRANSACTION;
      DELETE FROM reply WHERE username = p_username;
      DELETE FROM report WHERE username = p_username;
      DELETE FROM create_relation WHERE username = p_username;
      DELETE FROM User WHERE username = p_username;
    COMMIT;
    SELECT 1 AS affected, 'User banned successfully' AS message;
  END IF;
END//

CREATE PROCEDURE sp_admin_ban_publisher(IN p_username VARCHAR(20))
BEGIN
  DECLARE v_exists INT DEFAULT 0;
  SELECT COUNT(*) INTO v_exists FROM publisher WHERE username = p_username;
  
  IF v_exists = 0 THEN
    SELECT 0 AS affected, 'Publisher not found' AS message;
  ELSE
    START TRANSACTION;
      DELETE FROM create_relation WHERE username = p_username;
      DELETE FROM reply WHERE username = p_username;
      DELETE FROM report WHERE username = p_username;
      DELETE FROM publisher WHERE username = p_username;
      DELETE FROM User WHERE username = p_username;
    COMMIT;
    SELECT 1 AS affected, 'Publisher banned successfully' AS message;
  END IF;
END//

CREATE PROCEDURE sp_admin_ban_game(IN p_game_id INT)
BEGIN
  DECLARE v_exists INT DEFAULT 0;
  SELECT COUNT(*) INTO v_exists FROM game WHERE game_id = p_game_id;
  
  IF v_exists = 0 THEN
    SELECT 0 AS affected, 'Game not found' AS message;
  ELSE
    START TRANSACTION;
      DELETE FROM tag WHERE game_id = p_game_id;
      DELETE FROM play WHERE game_id = p_game_id;
      DELETE FROM game_update_history WHERE game_id = p_game_id;
      DELETE FROM report WHERE game_id = p_game_id;
      DELETE FROM create_relation WHERE game_id = p_game_id;
      DELETE FROM game WHERE game_id = p_game_id;
    COMMIT;
    SELECT 1 AS affected, 'Game banned successfully' AS message;
  END IF;
END//

CREATE PROCEDURE sp_admin_update_game_status(
  IN p_game_id INT,
  IN p_status ENUM('Approve','Reject','Pending'),
  IN p_admin_username VARCHAR(20)
)
BEGIN
  DECLARE v_exists INT DEFAULT 0;
  SELECT COUNT(*) INTO v_exists FROM game WHERE game_id = p_game_id;
  
  IF v_exists = 0 THEN
    SELECT 0 AS affected, 'Game not found' AS message;
  ELSE
    START TRANSACTION;
      UPDATE game SET status = p_status WHERE game_id = p_game_id;
      
      INSERT INTO game_update_history (patch_number, title, detail, link_to_new_file, is_approve, approve_time, approve_by, game_id)
      VALUES (
        'admin-review',
        CONCAT('Game ', IF(p_status = 'Approve', 'Approved', 'Rejected')),
        CONCAT('Admin review: ', IF(p_status = 'Approve', 'Approved', 'Rejected')),
        '',
        p_status,
        NOW(),
        p_admin_username,
        p_game_id
      );
    COMMIT;
    SELECT 1 AS affected, 'Game status updated' AS message;
  END IF;
END//

-- Dashboard analytics procedures
CREATE PROCEDURE sp_admin_get_daily_users()
BEGIN
  SELECT COUNT(DISTINCT username) AS count
  FROM `session`
  WHERE last_login_time >= DATE_SUB(NOW(), INTERVAL 1 DAY);
END//

CREATE PROCEDURE sp_admin_get_total_sessions()
BEGIN
  SELECT COUNT(DISTINCT username) AS count FROM `session`;
END//

CREATE PROCEDURE sp_admin_get_average_playtime()
BEGIN
  SELECT COALESCE(AVG(average_play_time), 0) AS averagePlayTime
  FROM `game`
  WHERE status IN ('Approve', 'Approved', 'Published');
END//

CREATE PROCEDURE sp_admin_get_popular_games()
BEGIN
  SELECT game_id AS id, game_name AS name, total_players AS totalPlayers
  FROM `game`
  WHERE status IN ('Approve', 'Approved', 'Published')
  ORDER BY total_players DESC, game_name ASC
  LIMIT 3;
END//

CREATE PROCEDURE sp_admin_get_signups_by_month(IN p_year INT)
BEGIN
  SELECT DATE_FORMAT(created_at, '%Y-%m') AS month, COUNT(*) AS signups
  FROM `User`
  WHERE YEAR(created_at) = p_year
  GROUP BY month
  ORDER BY month ASC;
END//

CREATE PROCEDURE sp_admin_get_players_by_month(IN p_year INT)
BEGIN
  SELECT DATE_FORMAT(last_login_time, '%Y-%m') AS month,
         COUNT(DISTINCT username) AS totalPlayers
  FROM `session`
  WHERE last_login_time IS NOT NULL
    AND YEAR(last_login_time) = p_year
  GROUP BY month
  ORDER BY month ASC;
END//

CREATE PROCEDURE sp_admin_get_recent_users()
BEGIN
  SELECT u.username, u.email, u.created_at AS createdAt,
         SUBSTRING_INDEX(s.device, '#', 1) as device
  FROM `User` u
  LEFT JOIN `publisher` p ON p.username = u.username
  LEFT JOIN `admin` a ON a.username = u.username
  LEFT JOIN (
    SELECT s1.username, s1.device
    FROM `session` s1
    INNER JOIN (
      SELECT username, MAX(last_login_time) as max_login
      FROM `session`
      GROUP BY username
    ) s2 ON s1.username = s2.username AND s1.last_login_time = s2.max_login
  ) s ON s.username = u.username
  WHERE p.username IS NULL AND a.username IS NULL
  ORDER BY u.created_at DESC;
END//

CREATE PROCEDURE sp_admin_get_publishers()
BEGIN
  SELECT p.username, p.account_name AS accountName,
         COUNT(g.game_id) AS publishedGames,
         SUBSTRING_INDEX(s.device, '#', 1) as device
  FROM `publisher` p
  LEFT JOIN `game` g ON g.publisher_username = p.username
    AND g.status IN ('Approve', 'Approved', 'Published')
  LEFT JOIN (
    SELECT s1.username, s1.device
    FROM `session` s1
    INNER JOIN (
      SELECT username, MAX(last_login_time) as max_login
      FROM `session`
      GROUP BY username
    ) s2 ON s1.username = s2.username AND s1.last_login_time = s2.max_login
  ) s ON s.username = p.username
  GROUP BY p.username, p.account_name, s.device
  ORDER BY publishedGames DESC, p.username ASC;
END//


-- Drop and recreate sp_admin_get_games to show only approved games
DROP PROCEDURE IF EXISTS sp_admin_get_games//

CREATE PROCEDURE sp_admin_get_games()
BEGIN
  SELECT game_id AS id, game_name AS name, status,
         COALESCE(total_players, 0) AS totalPlayers
  FROM `game`
  WHERE status = 'Approve'
  ORDER BY release_date DESC
  LIMIT 16;
END//

DROP PROCEDURE IF EXISTS sp_admin_get_pending_games//

CREATE PROCEDURE sp_admin_get_pending_games()
BEGIN
  SELECT game_id AS id, game_name AS name, 
         publisher_username AS publisher,
         status, release_date AS releaseDate
  FROM `game`
  WHERE status = 'Pending'
  ORDER BY release_date ASC;
END//


-- Developer-specific procedures
CREATE PROCEDURE sp_developer_validate_login(IN p_username VARCHAR(20))
BEGIN
  SELECT u.username, u.password_encrypted, u.salt_random_value
  FROM `User` u
  WHERE u.username = p_username
  LIMIT 1;
END//

CREATE PROCEDURE sp_developer_check_privileges(IN p_username VARCHAR(20))
BEGIN
  SELECT username FROM developer WHERE username = p_username LIMIT 1;
END//

CREATE PROCEDURE sp_developer_get_last_game_upload()
BEGIN
  SELECT MAX(release_date) as last_time 
  FROM game 
  WHERE release_date IS NOT NULL 
  LIMIT 1;
END//

CREATE PROCEDURE sp_developer_get_last_user_created()
BEGIN
  SELECT MAX(created_at) as last_time 
  FROM User 
  WHERE created_at IS NOT NULL 
  LIMIT 1;
END//

DELIMITER ;

-- =============================================================
-- User permission management with granular procedure-level access
-- Separation of concerns: user (public) vs developer (internal) vs admin (management)
-- =============================================================

-- Drop existing users if they exist (idempotent)
DROP USER IF EXISTS 'user'@'localhost';
DROP USER IF EXISTS 'developer'@'localhost';
DROP USER IF EXISTS 'admin'@'localhost';

-- =============================================================
-- Create database users
-- =============================================================
CREATE USER 'user'@'localhost' IDENTIFIED BY 'ToonFilmFirstWinnerPokPokPok1234';
CREATE USER 'developer'@'localhost' IDENTIFIED BY 'FirstWinnerToonFilmPokPokPok1234';
CREATE USER 'admin'@'localhost' IDENTIFIED BY 'PokPokPokToonFilmFirstWinner1234';

-- =============================================================
-- PUBLIC PROCEDURES - Accessible by all users (user, developer, admin)
-- These are the core application procedures used by the stack app
-- =============================================================

-- Authentication & Session Management
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_check_username TO 'user'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_check_email TO 'user'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_validate_login_fetch TO 'user'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_insert_session TO 'user'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_register_user_with_optional_publisher TO 'user'@'localhost';

-- Game Management (Public)
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_get_game_owner TO 'user'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_delete_game TO 'user'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_publisher_exists TO 'user'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_create_game TO 'user'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_game_add_initial_update TO 'user'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_check_game_exists TO 'user'@'localhost';

-- Game Queries & Lists
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_get_games_list TO 'user'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_count_games TO 'user'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_get_game_detail TO 'user'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_get_latest_game_update TO 'user'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_search_games TO 'user'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_get_trending_games TO 'user'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_get_new_games TO 'user'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_count_new_games TO 'user'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_get_all_games TO 'user'@'localhost';

-- Game Categories & Tags
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_get_games_by_tag TO 'user'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_count_games_by_tag TO 'user'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_get_game_tags TO 'user'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_get_game_versions TO 'user'@'localhost';

-- Game Reports
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_create_game_report TO 'user'@'localhost';

-- Publisher Dashboard
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_get_publisher_info TO 'user'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_get_publisher_games TO 'user'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_get_publisher_reports TO 'user'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_count_publisher_reports TO 'user'@'localhost';

-- Publisher Game Editing
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_update_game_link TO 'user'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_update_game_details TO 'user'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_publisher_submit_game_update TO 'user'@'localhost';

-- User Profile & Play Time
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_get_user_profile TO 'user'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_get_user_playtime TO 'user'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_get_user_total_playtime TO 'user'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_check_email_exists TO 'user'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_update_user_profile TO 'user'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_search_users TO 'user'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_play_add_time TO 'user'@'localhost';

-- Forum & Community
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_get_forum_threads TO 'user'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_get_forum_threads_cursor TO 'user'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_search_forum_threads TO 'user'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_get_thread_details TO 'user'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_check_thread_exists TO 'user'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_get_thread_replies TO 'user'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_check_reply_to_comment TO 'user'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_create_comment TO 'user'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_create_reply TO 'user'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_check_game_for_thread TO 'user'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_create_forum_thread TO 'user'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_get_user_created_threads TO 'user'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_get_user_commented_threads TO 'user'@'localhost';

-- Admin Approve Game (used in stack app)
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_admin_approve_game TO 'user'@'localhost';

-- =============================================================
-- DEVELOPER PROCEDURES - Accessible by developer & admin only
-- Grant all public procedures to developer first
-- =============================================================

-- All public procedures for developer
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_check_username TO 'developer'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_check_email TO 'developer'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_validate_login_fetch TO 'developer'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_insert_session TO 'developer'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_register_user_with_optional_publisher TO 'developer'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_get_game_owner TO 'developer'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_delete_game TO 'developer'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_publisher_exists TO 'developer'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_create_game TO 'developer'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_game_add_initial_update TO 'developer'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_check_game_exists TO 'developer'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_get_games_list TO 'developer'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_count_games TO 'developer'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_get_game_detail TO 'developer'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_get_latest_game_update TO 'developer'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_search_games TO 'developer'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_get_trending_games TO 'developer'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_get_new_games TO 'developer'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_count_new_games TO 'developer'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_get_all_games TO 'developer'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_get_games_by_tag TO 'developer'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_count_games_by_tag TO 'developer'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_get_game_tags TO 'developer'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_get_game_versions TO 'developer'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_create_game_report TO 'developer'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_get_publisher_info TO 'developer'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_get_publisher_games TO 'developer'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_get_publisher_reports TO 'developer'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_count_publisher_reports TO 'developer'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_update_game_link TO 'developer'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_update_game_details TO 'developer'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_publisher_submit_game_update TO 'developer'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_get_user_profile TO 'developer'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_get_user_playtime TO 'developer'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_get_user_total_playtime TO 'developer'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_check_email_exists TO 'developer'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_update_user_profile TO 'developer'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_search_users TO 'developer'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_play_add_time TO 'developer'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_get_forum_threads TO 'developer'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_get_forum_threads_cursor TO 'developer'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_search_forum_threads TO 'developer'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_get_thread_details TO 'developer'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_check_thread_exists TO 'developer'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_get_thread_replies TO 'developer'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_check_reply_to_comment TO 'developer'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_create_comment TO 'developer'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_create_reply TO 'developer'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_check_game_for_thread TO 'developer'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_create_forum_thread TO 'developer'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_get_user_created_threads TO 'developer'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_get_user_commented_threads TO 'developer'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_admin_approve_game TO 'developer'@'localhost';

-- Developer-specific procedures
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_developer_validate_login TO 'developer'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_developer_check_privileges TO 'developer'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_developer_get_last_game_upload TO 'developer'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_developer_get_last_user_created TO 'developer'@'localhost';

-- =============================================================
-- ADMIN PROCEDURES - Accessible by admin only
-- Grant all public procedures to admin first
-- =============================================================

-- All public procedures for admin
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_check_username TO 'admin'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_check_email TO 'admin'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_validate_login_fetch TO 'admin'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_insert_session TO 'admin'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_register_user_with_optional_publisher TO 'admin'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_get_game_owner TO 'admin'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_delete_game TO 'admin'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_publisher_exists TO 'admin'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_create_game TO 'admin'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_game_add_initial_update TO 'admin'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_check_game_exists TO 'admin'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_get_games_list TO 'admin'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_count_games TO 'admin'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_get_game_detail TO 'admin'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_get_latest_game_update TO 'admin'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_search_games TO 'admin'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_get_trending_games TO 'admin'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_get_new_games TO 'admin'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_count_new_games TO 'admin'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_get_all_games TO 'admin'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_get_games_by_tag TO 'admin'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_count_games_by_tag TO 'admin'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_get_game_tags TO 'admin'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_get_game_versions TO 'admin'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_create_game_report TO 'admin'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_get_publisher_info TO 'admin'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_get_publisher_games TO 'admin'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_get_publisher_reports TO 'admin'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_count_publisher_reports TO 'admin'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_update_game_link TO 'admin'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_update_game_details TO 'admin'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_publisher_submit_game_update TO 'admin'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_get_user_profile TO 'admin'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_get_user_playtime TO 'admin'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_get_user_total_playtime TO 'admin'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_check_email_exists TO 'admin'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_update_user_profile TO 'admin'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_search_users TO 'admin'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_play_add_time TO 'admin'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_get_forum_threads TO 'admin'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_get_forum_threads_cursor TO 'admin'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_search_forum_threads TO 'admin'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_get_thread_details TO 'admin'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_check_thread_exists TO 'admin'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_get_thread_replies TO 'admin'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_check_reply_to_comment TO 'admin'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_create_comment TO 'admin'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_create_reply TO 'admin'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_check_game_for_thread TO 'admin'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_create_forum_thread TO 'admin'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_get_user_created_threads TO 'admin'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_get_user_commented_threads TO 'admin'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_admin_approve_game TO 'admin'@'localhost';

-- Admin-specific procedures
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_admin_validate_login TO 'admin'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_admin_check_privileges TO 'admin'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_admin_check_user_exists TO 'admin'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_admin_create_user TO 'admin'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_admin_create_developer TO 'admin'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_admin_ban_user TO 'admin'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_admin_ban_publisher TO 'admin'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_admin_ban_game TO 'admin'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_admin_update_game_status TO 'admin'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_admin_get_daily_users TO 'admin'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_admin_get_total_sessions TO 'admin'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_admin_get_average_playtime TO 'admin'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_admin_get_popular_games TO 'admin'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_admin_get_signups_by_month TO 'admin'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_admin_get_players_by_month TO 'admin'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_admin_get_recent_users TO 'admin'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_admin_get_publishers TO 'admin'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_admin_get_games TO 'admin'@'localhost';
GRANT EXECUTE ON PROCEDURE Y25_DB.sp_admin_get_pending_games TO 'admin'@'localhost';

-- =============================================================
-- Finalize permissions
-- =============================================================
FLUSH PRIVILEGES;

-- =============================================================
-- Verification
-- =============================================================
SHOW GRANTS FOR 'user'@'localhost';
SHOW GRANTS FOR 'developer'@'localhost';
SHOW GRANTS FOR 'admin'@'localhost';