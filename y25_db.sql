-- phpMyAdmin SQL Dump
-- version 5.1.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Nov 08, 2025 at 03:49 AM
-- Server version: 5.7.24
-- PHP Version: 8.3.1

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `y25_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `admin`
--

CREATE TABLE `admin` (
  `username` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `admin`
--

INSERT INTO `admin` (`username`) VALUES
('admin_user');

-- --------------------------------------------------------

--
-- Table structure for table `comment`
--

CREATE TABLE `comment` (
  `comment_id` int(11) NOT NULL,
  `comment_text` varbinary(255) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `comment`
--

INSERT INTO `comment` (`comment_id`, `comment_text`, `created_at`) VALUES
(1, 0x476f6f642067616d652121, '2024-06-03 16:20:00'),
(2, 0x4e69636520757064617465, '2024-08-02 11:45:00'),
(3, 0x477265617420666561747572657321, '2024-09-02 14:30:00');

-- --------------------------------------------------------

--
-- Table structure for table `create_relation`
--

CREATE TABLE `create_relation` (
  `thread_name` varchar(70) NOT NULL,
  `username` varchar(20) NOT NULL,
  `game_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `create_relation`
--

INSERT INTO `create_relation` (`thread_name`, `username`, `game_id`) VALUES
('Welcome to Space Explorer', 'sarah_pub', 1),
('Mystery Manor Strategies', 'jane_smith', 2),
('Racing Champions League', 'sarah_pub', 3);

-- --------------------------------------------------------

--
-- Table structure for table `developer`
--

CREATE TABLE `developer` (
  `username` varchar(20) NOT NULL,
  `role` enum('Tester','Designer','Programmer') NOT NULL,
  `contact` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `developer`
--

INSERT INTO `developer` (`username`, `role`, `contact`) VALUES
('alex_dev', 'Programmer', '+1-555-0123'),
('jane_smith', 'Tester', '+1-555-0125'),
('john_doe', 'Designer', '+1-555-0124');

-- --------------------------------------------------------

--
-- Table structure for table `forum`
--

CREATE TABLE `forum` (
  `thread_name` varchar(70) NOT NULL,
  `detail` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `forum`
--

INSERT INTO `forum` (`thread_name`, `detail`, `created_at`) VALUES
('Mystery Manor Strategies', 'Share your tips and tricks for Mystery Manor', '2024-07-16 10:30:00'),
('Racing Champions League', 'Competitive racing discussion', '2024-09-01 13:45:00'),
('Welcome to Space Explorer', 'Official discussion thread for Space Explorer', '2024-06-02 08:15:00');

-- --------------------------------------------------------

--
-- Table structure for table `game`
--

CREATE TABLE `game` (
  `game_id` int(11) NOT NULL,
  `game_name` varchar(70) NOT NULL,
  `detail` varchar(255) DEFAULT NULL,
  `link_to_file` varchar(255) NOT NULL,
  `release_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `publisher_username` varchar(20) NOT NULL,
  `session_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `game`
--

INSERT INTO `game` (`game_id`, `game_name`, `detail`, `link_to_file`, `release_date`, `publisher_username`, `session_id`) VALUES
(1, 'Space Explorer', 'An exciting space adventure game', 'https://games.example.com/space-explorer', '2024-06-01 10:00:00', 'sarah_pub', 1),
(2, 'Mystery Manor', 'A thrilling detective game', 'https://games.example.com/mystery-manor', '2024-07-15 12:00:00', 'jane_smith', 2),
(3, 'Racing Champions', 'High-speed racing simulation', 'https://games.example.com/racing-champions', '2024-08-30 15:00:00', 'sarah_pub', 3);

-- --------------------------------------------------------

--
-- Table structure for table `game_update_history`
--

CREATE TABLE `game_update_history` (
  `update_id` int(11) NOT NULL,
  `patch_number` varchar(15) NOT NULL,
  `title` varchar(70) NOT NULL,
  `detail` varchar(255) DEFAULT NULL,
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `link_to_new_file` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `game_update_history`
--

INSERT INTO `game_update_history` (`update_id`, `patch_number`, `title`, `detail`, `update_time`, `link_to_new_file`) VALUES
(1, '1.0.1', 'Bug Fix Update', 'Fixed minor gameplay issues', '2024-06-15 09:30:00', 'https://patches.example.com/space-explorer/1.0.1'),
(2, '2.0.0', 'Major Content Update', 'Added new levels and features', '2024-08-01 14:45:00', 'https://patches.example.com/mystery-manor/2.0.0'),
(3, '1.1.0', 'Performance Update', 'Improved game performance', '2024-09-10 11:20:00', 'https://patches.example.com/racing-champions/1.1.0');

-- --------------------------------------------------------

--
-- Table structure for table `play`
--

CREATE TABLE `play` (
  `username` varchar(20) NOT NULL,
  `game_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `play`
--

INSERT INTO `play` (`username`, `game_id`) VALUES
('john_doe', 1),
('sarah_pub', 1),
('jane_smith', 2),
('john_doe', 2),
('alex_dev', 3),
('sarah_pub', 3);

-- --------------------------------------------------------

--
-- Table structure for table `publisher`
--

CREATE TABLE `publisher` (
  `username` varchar(20) NOT NULL,
  `account_name` varchar(70) DEFAULT NULL,
  `bank_account_serial` varchar(64) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `publisher`
--

INSERT INTO `publisher` (`username`, `account_name`, `bank_account_serial`) VALUES
('jane_smith', 'Creative Gaming Labs', 'ACC-001-XYZ'),
('sarah_pub', 'Amazing Games Studio', 'ACC-002-ABC');

-- --------------------------------------------------------

--
-- Table structure for table `reply`
--

CREATE TABLE `reply` (
  `thread_name` varchar(70) NOT NULL,
  `username` varchar(20) NOT NULL,
  `comment_id` int(11) NOT NULL,
  `reply_to_comment_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `reply`
--

INSERT INTO `reply` (`thread_name`, `username`, `comment_id`, `reply_to_comment_id`) VALUES
('Welcome to Space Explorer', 'john_doe', 1, NULL),
('Mystery Manor Strategies', 'jane_smith', 2, 1),
('Racing Champions League', 'alex_dev', 3, 2);

-- --------------------------------------------------------

--
-- Table structure for table `report`
--

CREATE TABLE `report` (
  `username` varchar(20) NOT NULL,
  `game_id` int(11) NOT NULL,
  `report_topic` enum('Lag','Disconnect','Bug') NOT NULL,
  `detail` varchar(255) DEFAULT NULL,
  `report_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `report`
--

INSERT INTO `report` (`username`, `game_id`, `report_topic`, `detail`, `report_time`) VALUES
('alex_dev', 3, 'Disconnect', 'Random disconnections during races', '2024-09-02 11:45:00'),
('jane_smith', 2, 'Lag', 'Experiencing delays in multiplayer', '2024-07-17 09:15:00'),
('john_doe', 1, 'Bug', 'Character gets stuck in corner', '2024-06-03 17:30:00');

-- --------------------------------------------------------

--
-- Table structure for table `session`
--

CREATE TABLE `session` (
  `session_id` int(11) NOT NULL,
  `username` varchar(20) NOT NULL,
  `start_play_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `device` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `session`
--

INSERT INTO `session` (`session_id`, `username`, `start_play_time`, `device`) VALUES
(1, 'john_doe', '2024-06-02 13:45:00', 'Windows PC'),
(2, 'jane_smith', '2024-07-16 15:30:00', 'MacBook Pro'),
(3, 'alex_dev', '2024-09-01 10:15:00', 'Linux Workstation'),
(4, 'john_doe', '2024-06-05 19:20:00', 'iPhone 13'),
(5, 'sarah_pub', '2024-07-20 14:10:00', 'Android Tablet');

-- --------------------------------------------------------

--
-- Table structure for table `tag`
--

CREATE TABLE `tag` (
  `tag_name` enum('Fantasy','RPG','FPS','MOBA','RTS') NOT NULL,
  `game_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `tag`
--

INSERT INTO `tag` (`tag_name`, `game_id`) VALUES
('Fantasy', 1),
('RPG', 2),
('RTS', 3);

-- --------------------------------------------------------

--
-- Table structure for table `update_version_relation`
--

CREATE TABLE `update_version_relation` (
  `game_id` int(11) NOT NULL,
  `update_id` int(11) NOT NULL,
  `username` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `update_version_relation`
--

INSERT INTO `update_version_relation` (`game_id`, `update_id`, `username`) VALUES
(1, 1, 'sarah_pub'),
(2, 2, 'jane_smith'),
(3, 3, 'sarah_pub');

-- --------------------------------------------------------

--
-- Table structure for table `user`
--

CREATE TABLE `user` (
  `username` varchar(20) NOT NULL,
  `password_encrypted` varchar(255) NOT NULL,
  `salt_random_value` varbinary(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `DOB` date NOT NULL,
  `sex` enum('Male','Female','Other') NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `user`
--

INSERT INTO `user` (`username`, `password_encrypted`, `salt_random_value`, `email`, `DOB`, `sex`, `created_at`) VALUES
('admin_user', '70a5a4ed4b774e9ec8ed11159bade79616b1326f483f80109dfca424acc27bfd', 0x73616c7435, 'admin@example.com', '1985-07-20', 'Male', '2024-01-01 08:00:00'),
('alex_dev', '4dcd53ea6bf9d48858c9dd6983f4796a23174442039df705581024430c2b5525', 0x73616c7433, 'alex@example.com', '1988-12-01', 'Other', '2024-03-10 11:20:00'),
('jane_smith', '14e7e5d3e577c8de02b48766f79ec21adb0caf12e76684b4902a115d0a99917b', 0x73616c7432, 'jane@example.com', '1992-08-23', 'Female', '2024-02-20 09:45:00'),
('john_doe', '15b4baa52c9496ead5adf3920985f7573cc8b44b68d38b10b6661e265c2ee00e', 0x73616c7431, 'john@example.com', '1990-05-15', 'Male', '2024-01-15 14:30:00'),
('sarah_pub', '00b47df26cbd8aaa873ffbfda351a9d969dbf7416df907fe157bc334807e2371', 0x73616c7434, 'sarah@example.com', '1995-03-10', 'Female', '2024-03-25 16:15:00');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admin`
--
ALTER TABLE `admin`
  ADD PRIMARY KEY (`username`);

--
-- Indexes for table `comment`
--
ALTER TABLE `comment`
  ADD PRIMARY KEY (`comment_id`);

--
-- Indexes for table `create_relation`
--
ALTER TABLE `create_relation`
  ADD PRIMARY KEY (`thread_name`,`username`,`game_id`),
  ADD KEY `FK_Create_Relation_User` (`username`),
  ADD KEY `FK_Create_Relation_Game` (`game_id`);

--
-- Indexes for table `developer`
--
ALTER TABLE `developer`
  ADD PRIMARY KEY (`username`);

--
-- Indexes for table `forum`
--
ALTER TABLE `forum`
  ADD PRIMARY KEY (`thread_name`);

--
-- Indexes for table `game`
--
ALTER TABLE `game`
  ADD PRIMARY KEY (`game_id`),
  ADD KEY `FK_Game_Publisher` (`publisher_username`),
  ADD KEY `FK_Game_Session` (`session_id`);

--
-- Indexes for table `game_update_history`
--
ALTER TABLE `game_update_history`
  ADD PRIMARY KEY (`update_id`);

--
-- Indexes for table `play`
--
ALTER TABLE `play`
  ADD PRIMARY KEY (`username`,`game_id`),
  ADD KEY `FK_Play_Game` (`game_id`);

--
-- Indexes for table `publisher`
--
ALTER TABLE `publisher`
  ADD PRIMARY KEY (`username`);

--
-- Indexes for table `reply`
--
ALTER TABLE `reply`
  ADD PRIMARY KEY (`thread_name`,`username`,`comment_id`),
  ADD KEY `FK_Reply_User` (`username`),
  ADD KEY `FK_Reply_Comment` (`comment_id`),
  ADD KEY `FK_Reply_ReplyToComment` (`reply_to_comment_id`);

--
-- Indexes for table `report`
--
ALTER TABLE `report`
  ADD PRIMARY KEY (`username`,`game_id`),
  ADD KEY `FK_Report_Game` (`game_id`);

--
-- Indexes for table `session`
--
ALTER TABLE `session`
  ADD PRIMARY KEY (`session_id`),
  ADD KEY `FK_Session_User` (`username`);

--
-- Indexes for table `tag`
--
ALTER TABLE `tag`
  ADD PRIMARY KEY (`tag_name`),
  ADD KEY `FK_Tag_Game` (`game_id`);

--
-- Indexes for table `update_version_relation`
--
ALTER TABLE `update_version_relation`
  ADD PRIMARY KEY (`game_id`,`update_id`,`username`),
  ADD KEY `FK_Update_Version_Relation_Game_Update_History` (`update_id`),
  ADD KEY `FK_Update_Version_Relation_Publisher` (`username`);

--
-- Indexes for table `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`username`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `comment`
--
ALTER TABLE `comment`
  MODIFY `comment_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `game`
--
ALTER TABLE `game`
  MODIFY `game_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `game_update_history`
--
ALTER TABLE `game_update_history`
  MODIFY `update_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `session`
--
ALTER TABLE `session`
  MODIFY `session_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `admin`
--
ALTER TABLE `admin`
  ADD CONSTRAINT `FK_Admin_User` FOREIGN KEY (`username`) REFERENCES `user` (`username`) ON DELETE CASCADE;

--
-- Constraints for table `create_relation`
--
ALTER TABLE `create_relation`
  ADD CONSTRAINT `FK_Create_Relation_Forum` FOREIGN KEY (`thread_name`) REFERENCES `forum` (`thread_name`) ON DELETE CASCADE,
  ADD CONSTRAINT `FK_Create_Relation_Game` FOREIGN KEY (`game_id`) REFERENCES `game` (`game_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `FK_Create_Relation_User` FOREIGN KEY (`username`) REFERENCES `user` (`username`);

--
-- Constraints for table `developer`
--
ALTER TABLE `developer`
  ADD CONSTRAINT `FK_Developer_User` FOREIGN KEY (`username`) REFERENCES `user` (`username`) ON DELETE CASCADE;

--
-- Constraints for table `game`
--
ALTER TABLE `game`
  ADD CONSTRAINT `FK_Game_Publisher` FOREIGN KEY (`publisher_username`) REFERENCES `publisher` (`username`),
  ADD CONSTRAINT `FK_Game_Session` FOREIGN KEY (`session_id`) REFERENCES `session` (`session_id`);

--
-- Constraints for table `play`
--
ALTER TABLE `play`
  ADD CONSTRAINT `FK_Play_Game` FOREIGN KEY (`game_id`) REFERENCES `game` (`game_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `FK_Play_User` FOREIGN KEY (`username`) REFERENCES `user` (`username`) ON DELETE CASCADE;

--
-- Constraints for table `publisher`
--
ALTER TABLE `publisher`
  ADD CONSTRAINT `FK_Publisher_User` FOREIGN KEY (`username`) REFERENCES `user` (`username`) ON DELETE CASCADE;

--
-- Constraints for table `reply`
--
ALTER TABLE `reply`
  ADD CONSTRAINT `FK_Reply_Comment` FOREIGN KEY (`comment_id`) REFERENCES `comment` (`comment_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `FK_Reply_Forum` FOREIGN KEY (`thread_name`) REFERENCES `forum` (`thread_name`) ON DELETE CASCADE,
  ADD CONSTRAINT `FK_Reply_ReplyToComment` FOREIGN KEY (`reply_to_comment_id`) REFERENCES `comment` (`comment_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `FK_Reply_User` FOREIGN KEY (`username`) REFERENCES `user` (`username`);

--
-- Constraints for table `report`
--
ALTER TABLE `report`
  ADD CONSTRAINT `FK_Report_Game` FOREIGN KEY (`game_id`) REFERENCES `game` (`game_id`),
  ADD CONSTRAINT `FK_Report_User` FOREIGN KEY (`username`) REFERENCES `user` (`username`) ON DELETE CASCADE;

--
-- Constraints for table `session`
--
ALTER TABLE `session`
  ADD CONSTRAINT `FK_Session_User` FOREIGN KEY (`username`) REFERENCES `user` (`username`) ON DELETE CASCADE;

--
-- Constraints for table `tag`
--
ALTER TABLE `tag`
  ADD CONSTRAINT `FK_Tag_Game` FOREIGN KEY (`game_id`) REFERENCES `game` (`game_id`) ON DELETE CASCADE;

--
-- Constraints for table `update_version_relation`
--
ALTER TABLE `update_version_relation`
  ADD CONSTRAINT `FK_Update_Version_Relation_Game` FOREIGN KEY (`game_id`) REFERENCES `game` (`game_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `FK_Update_Version_Relation_Game_Update_History` FOREIGN KEY (`update_id`) REFERENCES `game_update_history` (`update_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `FK_Update_Version_Relation_Publisher` FOREIGN KEY (`username`) REFERENCES `publisher` (`username`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
