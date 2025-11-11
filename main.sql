-- Main SQL file

CREATE database IF NOT EXISTS Y25_DB;
USE Y25_DB;

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
    link_to_file VARCHAR(255) NOT NULL,
    release_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
    constraint PK_Game_Update_History PRIMARY KEY (update_id)
);

CREATE TABLE IF NOT EXISTS forum (
    thread_name VARCHAR(70) NOT NULL,
    detail VARCHAR(255),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
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

CREATE TABLE IF NOT EXISTS update_version_relation (
    game_id INT NOT NULL,
    update_id INT NOT NULL,
    username VARCHAR(20) NOT NULL,
    constraint PK_Update_Version_Relation PRIMARY KEY (game_id, update_id, username),
    constraint FK_Update_Version_Relation_Game FOREIGN KEY (game_id) REFERENCES game(game_id) ON DELETE CASCADE,
    constraint FK_Update_Version_Relation_Game_Update_History FOREIGN KEY (update_id) REFERENCES game_update_history(update_id) ON DELETE CASCADE,
    constraint FK_Update_Version_Relation_Publisher FOREIGN KEY (username) REFERENCES publisher(username)
);