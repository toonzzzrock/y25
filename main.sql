-- Main SQL file

------------------------------------------------
---- CREATE DATABASE
------------------------------------------------

CREATE database IF NOT EXISTS Y25_DB;
USE Y25_DB;

------------------------------------------------
---- CREATE TABLE
------------------------------------------------

CREATE TABLE IF NOT EXISTS User (
    username VARCHAR(20) NOT NULL,
    password_encrypted VARCHAR(255) NOT NULL,
    salt_random_value VARBINARY(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    DOB DATE NOT NULL,
    sex enum('Male', 'Female', 'Other') NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    constraint PK_User PRIMARY KEY (username)
);

CREATE TABLE IF NOT EXISTS session (
    session_id INT NOT NULL AUTO_INCREMENT,
    username VARCHAR(20) NOT NULL,
    game_id INT NOT NULL,
    start_play_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    end_play_time DATETIME,
    device VARCHAR(50) NOT NULL,
    constraint PK_Session PRIMARY KEY (session_id),
    constraint FK_Session_User FOREIGN KEY (username) REFERENCES User(username) ON DELETE CASCADE,
    constraint FK_Session_Game FOREIGN KEY (game_id) REFERENCES game(game_id) ON DELETE CASCADE
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
    is_approve BOOLEAN NOT NULL,
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
    comment_text VARBINARY(255) NOT NULL,
    thread_name VARCHAR(70) NOT NULL,
    username VARCHAR(20) NOT NULL,
    reply_to_id INT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    constraint PK_Comment PRIMARY KEY (comment_id),
    constraint FK_Comment_Forum FOREIGN KEY (thread_name) REFERENCES forum(thread_name) ON DELETE CASCADE,
    constraint FK_Comment_User FOREIGN KEY (username) REFERENCES User(username),
    constraint FK_Comment_Reply FOREIGN KEY (reply_to_id) REFERENCES comment(comment_id)
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
    total_playtime INT DEFAULT 0,
    last_session_start DATETIME,
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
    game_id INT,
    constraint PK_Create_Relation PRIMARY KEY (thread_name, username),
    constraint FK_Create_Relation_Forum FOREIGN KEY (thread_name) REFERENCES forum(thread_name) ON DELETE CASCADE,
    constraint FK_Create_Relation_User FOREIGN KEY (username) REFERENCES User(username), -- ON DELETE CASCADE???
    constraint FK_Create_Relation_Game FOREIGN KEY (game_id) REFERENCES game(game_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS forum_participants (
    thread_name VARCHAR(70) NOT NULL,
    username VARCHAR(20) NOT NULL,
    first_comment_time DATETIME NOT NULL,
    constraint PK_Forum_Participants PRIMARY KEY (thread_name, username),
    constraint FK_Forum_Participants_Forum FOREIGN KEY (thread_name) REFERENCES forum(thread_name) ON DELETE CASCADE,
    constraint FK_Forum_Participants_User FOREIGN KEY (username) REFERENCES User(username)
);

------------------------------------------------------
---- TRIGGER and PROCEDURE
------------------------------------------------------

-- Session & Game Tracking Triggers
DELIMITER //

CREATE TRIGGER after_session_insert
AFTER INSERT ON session
FOR EACH ROW
BEGIN
    -- Update play table with new session start time
    INSERT INTO play (username, game_id, last_session_start)
    VALUES (NEW.username, NEW.game_id, NEW.start_play_time)
    ON DUPLICATE KEY UPDATE last_session_start = NEW.start_play_time;
    
    -- Increment live players counter for the game
    UPDATE game
    SET live_players = live_players + 1
    WHERE game_id = NEW.game_id;
END//

CREATE TRIGGER after_session_update
AFTER UPDATE ON session
FOR EACH ROW
BEGIN
    -- Calculate playtime for the old game session
    IF OLD.game_id != NEW.game_id THEN
        UPDATE play
        SET total_playtime = total_playtime + 
            TIMESTAMPDIFF(MINUTE, OLD.start_play_time, NOW())
        WHERE username = OLD.username AND game_id = OLD.game_id;
        
        -- Decrement live players counter for old game
        UPDATE game
        SET live_players = GREATEST(0, live_players - 1)
        WHERE game_id = OLD.game_id;
        
        -- Increment live players counter for new game
        UPDATE game
        SET live_players = live_players + 1
        WHERE game_id = NEW.game_id;
    END IF;
END//

CREATE TRIGGER after_session_delete
AFTER DELETE ON session
FOR EACH ROW
BEGIN
    -- Finalize playtime calculation
    UPDATE play
    SET total_playtime = total_playtime + 
        TIMESTAMPDIFF(MINUTE, last_session_start, NOW())
    WHERE username = OLD.username AND game_id = OLD.game_id;
    
    -- Decrement live players counter
    UPDATE game
    SET live_players = GREATEST(0, live_players - 1)
    WHERE game_id = OLD.game_id;
END//

-- Forum Thread Counters Triggers
CREATE TRIGGER after_reply_insert
AFTER INSERT ON reply
FOR EACH ROW
BEGIN
    -- Increment comment count
    UPDATE forum
    SET comment_count = comment_count + 1
    WHERE thread_name = NEW.thread_name;
    
    -- Check if this is user's first comment in the thread
    IF NOT EXISTS (
        SELECT 1 FROM forum_participants
        WHERE thread_name = NEW.thread_name AND username = NEW.username
    ) THEN
        -- Insert into forum_participants
        INSERT INTO forum_participants (thread_name, username, first_comment_time)
        VALUES (NEW.thread_name, NEW.username, NOW());
        
        -- Increment unique users count
        UPDATE forum
        SET unique_users = unique_users + 1
        WHERE thread_name = NEW.thread_name;
    END IF;
END//

-- Comment to Reply Relation Trigger
CREATE TRIGGER after_comment_insert
AFTER INSERT ON comment
FOR EACH ROW
BEGIN
    -- Insert into reply table
    -- NEW.reply_to_id will be NULL for initial comments
    -- NEW.reply_to_id will have the parent comment_id for replies
    INSERT INTO reply (thread_name, username, comment_id, reply_to_comment_id)
    VALUES (NEW.thread_name, NEW.username, NEW.comment_id, NEW.reply_to_id);
END//

-- Stored Procedures

CREATE PROCEDURE register_user(
    IN p_username VARCHAR(20),
    IN p_password VARCHAR(255),
    IN p_email VARCHAR(255),
    IN p_dob DATE,
    IN p_sex ENUM('Male', 'Female', 'Other'),
    IN p_role VARCHAR(20),
    IN p_additional_info VARCHAR(255)
)
BEGIN
    DECLARE v_salt VARBINARY(255);
    DECLARE v_pepper VARCHAR(255);
    DECLARE v_hashed_password VARCHAR(255);
    
    -- Generate random salt
    SET v_salt = RANDOM_BYTES(32);
    -- In real implementation, pepper would be stored in environment variables
    SET v_pepper = 'your_secure_pepper_value';
    
    -- Hash password with salt and pepper
    SET v_hashed_password = SHA2(CONCAT(p_password, v_salt, v_pepper), 256);
    
    -- Start transaction
    START TRANSACTION;
    
    -- Insert into User table
    INSERT INTO User (username, password_encrypted, salt_random_value, email, DOB, sex)
    VALUES (p_username, v_hashed_password, v_salt, p_email, p_dob, p_sex);
    
    -- Based on role, insert into appropriate table
    CASE p_role
        WHEN 'Developer' THEN
            INSERT INTO developer (username, role, contact)
            VALUES (p_username, p_additional_info, '');
        WHEN 'Publisher' THEN
            INSERT INTO publisher (username, account_name)
            VALUES (p_username, p_additional_info);
        WHEN 'Admin' THEN
            INSERT INTO admin (username)
            VALUES (p_username);
    END CASE;
    
    COMMIT;
END//

CREATE PROCEDURE validate_login(
    IN p_username VARCHAR(20),
    IN p_password VARCHAR(255),
    OUT p_is_valid BOOLEAN
)
BEGIN
    DECLARE v_stored_hash VARCHAR(255);
    DECLARE v_salt VARBINARY(255);
    DECLARE v_pepper VARCHAR(255);
    DECLARE v_calculated_hash VARCHAR(255);
    
    -- Get stored hash and salt
    SELECT password_encrypted, salt_random_value
    INTO v_stored_hash, v_salt
    FROM User
    WHERE username = p_username;
    
    -- Set pepper (in real implementation, would be from environment variables)
    SET v_pepper = 'your_secure_pepper_value';
    
    -- Calculate hash with provided password
    SET v_calculated_hash = SHA2(CONCAT(p_password, v_salt, v_pepper), 256);
    
    -- Compare hashes
    SET p_is_valid = (v_stored_hash = v_calculated_hash);
END//

CREATE PROCEDURE validate_password(
    IN p_password VARCHAR(255),
    OUT p_is_valid BOOLEAN,
    OUT p_error_message VARCHAR(255)
)
BEGIN
    SET p_is_valid = TRUE;
    SET p_error_message = NULL;
    
    -- Check length
    IF LENGTH(p_password) < 8 THEN
        SET p_is_valid = FALSE;
        SET p_error_message = 'Password must be at least 8 characters long';
        RETURN;
    END IF;
    
    -- Check for uppercase
    IF p_password NOT REGEXP '[A-Z]' THEN
        SET p_is_valid = FALSE;
        SET p_error_message = 'Password must contain at least one uppercase letter';
        RETURN;
    END IF;
    
    -- Check for lowercase
    IF p_password NOT REGEXP '[a-z]' THEN
        SET p_is_valid = FALSE;
        SET p_error_message = 'Password must contain at least one lowercase letter';
        RETURN;
    END IF;
    
    -- Check for digit
    IF p_password NOT REGEXP '[0-9]' THEN
        SET p_is_valid = FALSE;
        SET p_error_message = 'Password must contain at least one digit';
        RETURN;
    END IF;
    
    -- Check for special character
    IF p_password NOT REGEXP '[^A-Za-z0-9]' THEN
        SET p_is_valid = FALSE;
        SET p_error_message = 'Password must contain at least one special character';
        RETURN;
    END IF;
END//

CREATE PROCEDURE create_game(
    IN p_publisher_username VARCHAR(20),
    IN p_game_name VARCHAR(70),
    IN p_detail VARCHAR(255),
    IN p_link_to_file VARCHAR(255)
)
BEGIN
    DECLARE v_game_id INT;
    
    -- Validate publisher
    IF NOT EXISTS (SELECT 1 FROM publisher WHERE username = p_publisher_username) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'User is not a publisher';
    END IF;
    
    -- Start transaction
    START TRANSACTION;
    
    -- Create game
    INSERT INTO game (game_name, detail, link_to_file, publisher_username)
    VALUES (p_game_name, p_detail, p_link_to_file, p_publisher_username);
    
    SET v_game_id = LAST_INSERT_ID();
    
    -- Create initial version in update history
    INSERT INTO game_update_history (patch_number, title, detail, link_to_new_file)
    VALUES ('1.0.0', 'Initial Release', 'First release of the game', p_link_to_file);
    
    -- Link update to game and publisher
    INSERT INTO update_version_relation (game_id, update_id, username)
    VALUES (v_game_id, LAST_INSERT_ID(), p_publisher_username);
    
    COMMIT;
END//

CREATE PROCEDURE create_forum_thread(
    IN p_username VARCHAR(20),
    IN p_thread_name VARCHAR(70),
    IN p_detail VARCHAR(255),
    IN p_game_id INT
)
BEGIN
    DECLARE v_game_exists BOOLEAN;
    
    -- Check if game exists if game_id is provided
    IF p_game_id IS NOT NULL THEN
        SELECT EXISTS(SELECT 1 FROM game WHERE game_id = p_game_id) INTO v_game_exists;
        IF NOT v_game_exists THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Specified game does not exist';
        END IF;
    END IF;
    
    -- Start transaction
    START TRANSACTION;
    
    -- Create forum thread with initial counters set to 0
    INSERT INTO forum (thread_name, detail, comment_count, unique_users)
    VALUES (p_thread_name, p_detail, 0, 0); -- unique_users = 1???
    
    -- Create relation with game (if exists) and user
    INSERT INTO create_relation (thread_name, username, game_id)
    VALUES (p_thread_name, p_username, p_game_id);
    
    -- Initialize forum_participants with creator (but no comment yet)
    INSERT INTO forum_participants (thread_name, username, first_comment_time)
    VALUES (p_thread_name, p_username, NOW());
    
    -- Note: We don't set any initial comment count since creation doesn't count as a comment
    
    COMMIT;
END//

DELIMITER ;

-------------------------------------------------------------
---- USER ROLE
-------------------------------------------------------------

-- Create 'user' role (regular player)
CREATE USER 'user'@'localhost' IDENTIFIED BY 'password';

-- Create 'admin' role (system administrator)
CREATE USER 'admin'@'localhost' IDENTIFIED BY 'password';

-- Create 'developer' role (game developer)
CREATE USER 'developer'@'localhost' IDENTIFIED BY 'password';

-- =====================================================
-- USER ROLE PERMISSIONS
-- =====================================================
-- USER can:
-- INSERT: All tables EXCEPT developer, admin, tag
-- SELECT: All tables EXCEPT developer, admin, report
-- UPDATE: All tables EXCEPT developer, admin, report, tag, update_version_relation
-- DELETE: Only session, forum, comment, reply, create_relation

-- INSERT privileges for user
GRANT INSERT ON Y25_DB.User TO 'user'@'localhost';
GRANT INSERT ON Y25_DB.session TO 'user'@'localhost';
GRANT INSERT ON Y25_DB.publisher TO 'user'@'localhost';
GRANT INSERT ON Y25_DB.game TO 'user'@'localhost';
GRANT INSERT ON Y25_DB.game_update_history TO 'user'@'localhost';
GRANT INSERT ON Y25_DB.forum TO 'user'@'localhost';
GRANT INSERT ON Y25_DB.comment TO 'user'@'localhost';
GRANT INSERT ON Y25_DB.reply TO 'user'@'localhost';
GRANT INSERT ON Y25_DB.play TO 'user'@'localhost';
GRANT INSERT ON Y25_DB.create_relation TO 'user'@'localhost';
GRANT INSERT ON Y25_DB.update_version_relation TO 'user'@'localhost';
GRANT INSERT ON Y25_DB.forum_participants TO 'user'@'localhost';

-- SELECT privileges for user (all EXCEPT developer, admin, report)
GRANT SELECT ON Y25_DB.User TO 'user'@'localhost';
GRANT SELECT ON Y25_DB.session TO 'user'@'localhost';
GRANT SELECT ON Y25_DB.publisher TO 'user'@'localhost';
GRANT SELECT ON Y25_DB.game TO 'user'@'localhost';
GRANT SELECT ON Y25_DB.game_update_history TO 'user'@'localhost';
GRANT SELECT ON Y25_DB.forum TO 'user'@'localhost';
GRANT SELECT ON Y25_DB.comment TO 'user'@'localhost';
GRANT SELECT ON Y25_DB.reply TO 'user'@'localhost';
GRANT SELECT ON Y25_DB.play TO 'user'@'localhost';
GRANT SELECT ON Y25_DB.tag TO 'user'@'localhost';
GRANT SELECT ON Y25_DB.create_relation TO 'user'@'localhost';
GRANT SELECT ON Y25_DB.update_version_relation TO 'user'@'localhost';
GRANT SELECT ON Y25_DB.forum_participants TO 'user'@'localhost';

-- UPDATE privileges for user (all EXCEPT developer, admin, report, tag, update_version_relation)
GRANT UPDATE ON Y25_DB.User TO 'user'@'localhost';
GRANT UPDATE ON Y25_DB.session TO 'user'@'localhost';
GRANT UPDATE ON Y25_DB.publisher TO 'user'@'localhost';
GRANT UPDATE ON Y25_DB.game TO 'user'@'localhost';
GRANT UPDATE ON Y25_DB.game_update_history TO 'user'@'localhost';
GRANT UPDATE ON Y25_DB.forum TO 'user'@'localhost';
GRANT UPDATE ON Y25_DB.comment TO 'user'@'localhost';
GRANT UPDATE ON Y25_DB.reply TO 'user'@'localhost';
GRANT UPDATE ON Y25_DB.play TO 'user'@'localhost';
GRANT UPDATE ON Y25_DB.create_relation TO 'user'@'localhost';
GRANT UPDATE ON Y25_DB.forum_participants TO 'user'@'localhost';

-- DELETE privileges for user (only session, forum, comment, reply, create_relation)
GRANT DELETE ON Y25_DB.session TO 'user'@'localhost';
GRANT DELETE ON Y25_DB.forum TO 'user'@'localhost';
GRANT DELETE ON Y25_DB.comment TO 'user'@'localhost';
GRANT DELETE ON Y25_DB.reply TO 'user'@'localhost';
GRANT DELETE ON Y25_DB.create_relation TO 'user'@'localhost';

-- =====================================================
-- ADMIN ROLE PERMISSIONS
-- =====================================================
-- ADMIN can: INSERT, SELECT, UPDATE, DELETE on ALL tables

GRANT INSERT, SELECT, UPDATE, DELETE ON Y25_DB.* TO 'admin'@'localhost';

-- =====================================================
-- DEVELOPER ROLE PERMISSIONS
-- =====================================================
-- DEVELOPER can:
-- INSERT: All tables
-- UPDATE: All tables
-- DELETE: All tables
-- SELECT: All tables EXCEPT admin

GRANT INSERT, UPDATE, DELETE ON Y25_DB.* TO 'developer'@'localhost';

-- SELECT privileges for developer (all EXCEPT admin)
GRANT SELECT ON Y25_DB.User TO 'developer'@'localhost';
GRANT SELECT ON Y25_DB.session TO 'developer'@'localhost';
GRANT SELECT ON Y25_DB.developer TO 'developer'@'localhost';
GRANT SELECT ON Y25_DB.publisher TO 'developer'@'localhost';
GRANT SELECT ON Y25_DB.game TO 'developer'@'localhost';
GRANT SELECT ON Y25_DB.game_update_history TO 'developer'@'localhost';
GRANT SELECT ON Y25_DB.forum TO 'developer'@'localhost';
GRANT SELECT ON Y25_DB.comment TO 'developer'@'localhost';
GRANT SELECT ON Y25_DB.reply TO 'developer'@'localhost';
GRANT SELECT ON Y25_DB.report TO 'developer'@'localhost';
GRANT SELECT ON Y25_DB.play TO 'developer'@'localhost';
GRANT SELECT ON Y25_DB.tag TO 'developer'@'localhost';
GRANT SELECT ON Y25_DB.create_relation TO 'developer'@'localhost';
GRANT SELECT ON Y25_DB.update_version_relation TO 'developer'@'localhost';
GRANT SELECT ON Y25_DB.forum_participants TO 'developer'@'localhost';

-- =====================================================
-- APPLY CHANGES
-- =====================================================

FLUSH PRIVILEGES;