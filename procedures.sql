-- Stored procedures for the Next.js stack APIs
-- Compatible with MySQL 5.7

DELIMITER //

CREATE PROCEDURE sp_get_game_owner(IN p_game_id INT)
BEGIN
  SELECT game_id, game_name, publisher_username
  FROM game
  WHERE game_id = p_game_id
  LIMIT 1;
END//

CREATE PROCEDURE sp_delete_game(IN p_game_id INT)
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

CREATE PROCEDURE sp_publisher_exists(IN p_username VARCHAR(20))
BEGIN
  SELECT EXISTS(SELECT 1 FROM publisher WHERE username = p_username) AS exists_flag;
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

CREATE PROCEDURE sp_game_add_initial_update(
  IN p_game_id INT,
  IN p_link VARCHAR(255)
)
BEGIN
  INSERT INTO game_update_history (patch_number, title, detail, link_to_new_file, game_id)
  VALUES ('0', 'init', 'init', p_link, p_game_id);
  SELECT ROW_COUNT() AS affected;
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

CREATE PROCEDURE sp_check_username(IN p_username VARCHAR(20))
BEGIN
  SELECT COUNT(*) AS count FROM `User` WHERE username = p_username;
END//

CREATE PROCEDURE sp_check_email(IN p_email VARCHAR(255))
BEGIN
  SELECT COUNT(*) AS count FROM `User` WHERE email = p_email;
END//

CREATE PROCEDURE sp_validate_login_fetch(IN p_identifier VARCHAR(255))
BEGIN
  SELECT username, password_encrypted, salt_random_value, email
  FROM `User`
  WHERE username = p_identifier OR email = p_identifier
  LIMIT 1;
END//

CREATE PROCEDURE sp_insert_session(
  IN p_username VARCHAR(20),
  IN p_device VARCHAR(50)
)
BEGIN
  DELETE FROM session WHERE username = p_username;
  INSERT INTO session (username, last_login_time, device)
  VALUES (p_username, NOW(), p_device);
  SELECT LAST_INSERT_ID() AS session_id;
END//

CREATE PROCEDURE sp_play_add_time(
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

CREATE PROCEDURE sp_register_user_with_optional_publisher(
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

DELIMITER ;
