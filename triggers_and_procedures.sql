-- Add new columns to forum table for counters
ALTER TABLE forum 
ADD COLUMN comment_count INT DEFAULT 0,
ADD COLUMN unique_users INT DEFAULT 0;

-- Add new column to game table for live players counter
ALTER TABLE game
ADD COLUMN live_players INT DEFAULT 0;

-- Add new columns to track playtime
ALTER TABLE play
ADD COLUMN total_playtime INT DEFAULT 0,
ADD COLUMN last_session_start DATETIME;

-- Add column to track unique commenters per thread
CREATE TABLE IF NOT EXISTS forum_participants (
    thread_name VARCHAR(70) NOT NULL,
    username VARCHAR(20) NOT NULL,
    first_comment_time DATETIME NOT NULL,
    constraint PK_Forum_Participants PRIMARY KEY (thread_name, username),
    constraint FK_Forum_Participants_Forum FOREIGN KEY (thread_name) REFERENCES forum(thread_name) ON DELETE CASCADE,
    constraint FK_Forum_Participants_User FOREIGN KEY (username) REFERENCES User(username)
);

-- Session & Game Tracking Triggers
DELIMITER //

CREATE TRIGGER after_session_insert
AFTER INSERT ON session
FOR EACH ROW
BEGIN
    -- Update play table with new session start time
    INSERT INTO play (username, game_id, last_session_start)
    SELECT NEW.username, g.game_id, NEW.start_play_time
    FROM game g
    WHERE g.session_id = NEW.session_id
    ON DUPLICATE KEY UPDATE last_session_start = NEW.start_play_time;
    
    -- Increment live players counter for the game
    UPDATE game g
    SET live_players = live_players + 1
    WHERE g.session_id = NEW.session_id;
END//

CREATE TRIGGER after_session_update
AFTER UPDATE ON session
FOR EACH ROW
BEGIN
    -- Calculate playtime for the old game session
    IF OLD.session_id != NEW.session_id THEN
        UPDATE play p
        JOIN game g ON g.session_id = OLD.session_id
        SET p.total_playtime = p.total_playtime + 
            TIMESTAMPDIFF(MINUTE, p.last_session_start, NOW())
        WHERE p.username = OLD.username;
        
        -- Decrement live players counter for old game
        UPDATE game
        SET live_players = GREATEST(0, live_players - 1)
        WHERE session_id = OLD.session_id;
        
        -- Increment live players counter for new game
        UPDATE game
        SET live_players = live_players + 1
        WHERE session_id = NEW.session_id;
    END IF;
END//

CREATE TRIGGER after_session_delete
AFTER DELETE ON session
FOR EACH ROW
BEGIN
    -- Finalize playtime calculation
    UPDATE play p
    JOIN game g ON g.session_id = OLD.session_id
    SET p.total_playtime = p.total_playtime + 
        TIMESTAMPDIFF(MINUTE, p.last_session_start, NOW())
    WHERE p.username = OLD.username;
    
    -- Decrement live players counter
    UPDATE game
    SET live_players = GREATEST(0, live_players - 1)
    WHERE session_id = OLD.session_id;
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
    IN p_link_to_file VARCHAR(255),
    IN p_session_id INT
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
    INSERT INTO game (game_name, detail, link_to_file, publisher_username, session_id)
    VALUES (p_game_name, p_detail, p_link_to_file, p_publisher_username, p_session_id);
    
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