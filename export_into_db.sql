/*M!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.19-11.4.8-MariaDB, for Linux (x86_64)
--
-- Host: localhost    Database: Y25_DB
-- ------------------------------------------------------
-- Server version	11.4.8-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*M!100616 SET @OLD_NOTE_VERBOSITY=@@NOTE_VERBOSITY, NOTE_VERBOSITY=0 */;

--
-- Current Database: `Y25_DB`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `Y25_DB` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */;

USE `Y25_DB`;

--
-- Table structure for table `User`
--

DROP TABLE IF EXISTS `User`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `User` (
  `username` varchar(20) NOT NULL,
  `password_encrypted` varchar(255) NOT NULL,
  `salt_random_value` varbinary(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `DOB` date NOT NULL,
  `sex` enum('Male','Female','Other') NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `User`
--

LOCK TABLES `User` WRITE;
/*!40000 ALTER TABLE `User` DISABLE KEYS */;
INSERT INTO `User` VALUES
('admin_user','70a5a4ed4b774e9ec8ed11159bade79616b1326f483f80109dfca424acc27bfd','salt5','admin@example.com','1985-07-20','Male','2024-01-01 08:00:00'),
('alex_dev','4dcd53ea6bf9d48858c9dd6983f4796a23174442039df705581024430c2b5525','salt3','alex@example.com','1988-12-01','Other','2024-03-10 11:20:00'),
('jane_smith','14e7e5d3e577c8de02b48766f79ec21adb0caf12e76684b4902a115d0a99917b','salt2','jane@example.com','1992-08-23','Female','2024-02-20 09:45:00'),
('john_doe','15b4baa52c9496ead5adf3920985f7573cc8b44b68d38b10b6661e265c2ee00e','salt1','john@example.com','1990-05-15','Male','2024-01-15 14:30:00'),
('patipat','858b8c4de9d6fd8307af9a4d5dfa339e1c228b3c56d2de69b2e92d01cf3cb3c6','825085398b13107fb8171a469125201eee0a19d9ba0d8f4ad42a8eb13f9878a6','toonzzzr5ock@proton.me','1978-11-12','Male','2025-11-11 13:34:57'),
('sarah_pub','00b47df26cbd8aaa873ffbfda351a9d969dbf7416df907fe157bc334807e2371','salt4','sarah@example.com','1995-03-10','Female','2024-03-25 16:15:00'),
('toonzzz','b233fa3edf42bd2b2ac50de70da29e26513fa5807dcf9a8e69244d57e43f6d57','e95dbe982f4f760cb65de7f9b7bbcad3d86cbac05b47afeff5e3338768c54485','toonzzzrossck@proton.me','1972-11-15','Female','2025-11-11 13:39:07'),
('toonzzzrock','75226789d8d2f30e067d3cdaa182f9bacd4f98679ddb6e4fbfdae9d939aa88ec','2Ç~>w-©ö?\" ôi™)ØØÆK“\ZDêÇÕ∆{+õ','toonzzzrock@proton.me','2025-11-03','Female','2025-11-10 16:03:31'),
('toonzzzrock2','7ba4f09d39d7bfdc263f2561962b329fcec7a867b29df53f689e659390a1e732','d50a04a4b13f6f5ccad0f85748769ef9afebe3fe9c0425bd8084d82d47288786','toonzzzrock2@proton.me','1992-10-02','Male','2025-11-12 06:48:04'),
('toonzzzrock3','bd04cc0765d000843097547cf4322d214f8845db3d7cf02a9c86b82934eaaca7','d3662bc8ce018f181e5ce4743e9a0d839463cfc14d98ef5e7e70c5a402dcca7a','toonzzzrock3@proton.me','1992-10-02','Male','2025-11-12 06:49:05');
/*!40000 ALTER TABLE `User` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `admin`
--

DROP TABLE IF EXISTS `admin`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin` (
  `username` varchar(20) NOT NULL,
  PRIMARY KEY (`username`),
  CONSTRAINT `FK_Admin_User` FOREIGN KEY (`username`) REFERENCES `User` (`username`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin`
--

LOCK TABLES `admin` WRITE;
/*!40000 ALTER TABLE `admin` DISABLE KEYS */;
INSERT INTO `admin` VALUES
('admin_user');
/*!40000 ALTER TABLE `admin` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `comment`
--

DROP TABLE IF EXISTS `comment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `comment` (
  `comment_id` int(11) NOT NULL AUTO_INCREMENT,
  `comment_text` varbinary(255) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`comment_id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `comment`
--

LOCK TABLES `comment` WRITE;
/*!40000 ALTER TABLE `comment` DISABLE KEYS */;
INSERT INTO `comment` VALUES
(1,'Good game!!','2024-06-03 16:20:00'),
(2,'Nice update','2024-08-02 11:45:00'),
(3,'Great features!','2024-09-02 14:30:00'),
(4,'test ‡πÜ','2025-11-12 00:52:20'),
(5,'testssss','2025-11-12 01:10:08'),
(6,'is this really work?','2025-11-12 03:08:03'),
(7,'yep it work\n\nwow','2025-11-12 03:08:13'),
(8,'ok','2025-11-12 03:08:23'),
(9,'test ddd\n\n555','2025-11-12 13:44:19'),
(10,'waawawa','2025-11-12 15:27:09'),
(11,'test','2025-11-12 19:48:46'),
(12,'why','2025-11-12 19:48:51');
/*!40000 ALTER TABLE `comment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `create_relation`
--

DROP TABLE IF EXISTS `create_relation`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `create_relation` (
  `thread_name` varchar(70) NOT NULL,
  `username` varchar(20) NOT NULL,
  `game_id` int(11) NOT NULL,
  PRIMARY KEY (`thread_name`,`username`,`game_id`),
  KEY `FK_Create_Relation_User` (`username`),
  KEY `FK_Create_Relation_Game` (`game_id`),
  CONSTRAINT `FK_Create_Relation_Forum` FOREIGN KEY (`thread_name`) REFERENCES `forum` (`thread_name`) ON DELETE CASCADE,
  CONSTRAINT `FK_Create_Relation_Game` FOREIGN KEY (`game_id`) REFERENCES `game` (`game_id`) ON DELETE CASCADE,
  CONSTRAINT `FK_Create_Relation_User` FOREIGN KEY (`username`) REFERENCES `User` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `create_relation`
--

LOCK TABLES `create_relation` WRITE;
/*!40000 ALTER TABLE `create_relation` DISABLE KEYS */;
INSERT INTO `create_relation` VALUES
('tst','toonzzzrock3',1),
('Welcome to Space Explorer','sarah_pub',1),
('Mystery Manor Strategies','jane_smith',2),
('btuh','toonzzzrock3',3),
('Racing Champions League','sarah_pub',3),
('stst','patipat',3);
/*!40000 ALTER TABLE `create_relation` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `developer`
--

DROP TABLE IF EXISTS `developer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `developer` (
  `username` varchar(20) NOT NULL,
  `role` enum('Tester','Designer','Programmer') NOT NULL,
  `contact` varchar(255) NOT NULL,
  PRIMARY KEY (`username`),
  CONSTRAINT `FK_Developer_User` FOREIGN KEY (`username`) REFERENCES `User` (`username`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `developer`
--

LOCK TABLES `developer` WRITE;
/*!40000 ALTER TABLE `developer` DISABLE KEYS */;
INSERT INTO `developer` VALUES
('alex_dev','Programmer','+1-555-0123'),
('jane_smith','Tester','+1-555-0125'),
('john_doe','Designer','+1-555-0124');
/*!40000 ALTER TABLE `developer` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `forum`
--

DROP TABLE IF EXISTS `forum`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `forum` (
  `thread_name` varchar(70) NOT NULL,
  `detail` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`thread_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `forum`
--

LOCK TABLES `forum` WRITE;
/*!40000 ALTER TABLE `forum` DISABLE KEYS */;
INSERT INTO `forum` VALUES
('btuh','asd','2025-11-12 15:27:23'),
('Mystery Manor Strategies','Share your tips and tricks for Mystery Manor','2024-07-16 10:30:00'),
('Racing Champions League','Competitive racing discussion','2024-09-01 13:45:00'),
('stst','stsst','2025-11-12 02:31:27'),
('tst','sst','2025-11-12 19:50:31'),
('Welcome to Space Explorer','Official discussion thread for Space Explorer','2024-06-02 08:15:00');
/*!40000 ALTER TABLE `forum` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `game`
--

DROP TABLE IF EXISTS `game`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `game` (
  `game_id` int(11) NOT NULL AUTO_INCREMENT,
  `game_name` varchar(70) NOT NULL,
  `detail` varchar(255) DEFAULT NULL,
  `link_to_file` varchar(255) NOT NULL,
  `release_date` datetime NOT NULL DEFAULT current_timestamp(),
  `publisher_username` varchar(20) NOT NULL,
  PRIMARY KEY (`game_id`),
  KEY `FK_Game_Publisher` (`publisher_username`),
  CONSTRAINT `FK_Game_Publisher` FOREIGN KEY (`publisher_username`) REFERENCES `publisher` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `game`
--

LOCK TABLES `game` WRITE;
/*!40000 ALTER TABLE `game` DISABLE KEYS */;
INSERT INTO `game` VALUES
(1,'Space Explorer','An exciting space adventure game','index.html','2024-06-01 10:00:00','sarah_pub'),
(2,'Mystery Manor','A thrilling detective game','index.html','2024-07-15 12:00:00','toonzzzrock3'),
(3,'Racing Champions','High-speed racing simulation','index.html','2024-08-30 15:00:00','toonzzzrock3');
/*!40000 ALTER TABLE `game` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `game_update_history`
--

DROP TABLE IF EXISTS `game_update_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `game_update_history` (
  `update_id` int(11) NOT NULL AUTO_INCREMENT,
  `patch_number` varchar(15) NOT NULL,
  `title` varchar(70) NOT NULL,
  `detail` varchar(255) DEFAULT NULL,
  `update_time` datetime NOT NULL DEFAULT current_timestamp(),
  `link_to_new_file` varchar(255) NOT NULL,
  PRIMARY KEY (`update_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `game_update_history`
--

LOCK TABLES `game_update_history` WRITE;
/*!40000 ALTER TABLE `game_update_history` DISABLE KEYS */;
INSERT INTO `game_update_history` VALUES
(1,'1.0.1','Bug Fix Update','Fixed minor gameplay issues','2024-06-15 09:30:00','index.html'),
(2,'2.0.0','Major Content Update','Added new levels and features','2024-08-01 14:45:00','index.html'),
(3,'1.1.0','Performance Update','Improved game performance','2024-09-10 11:20:00','index.html');
/*!40000 ALTER TABLE `game_update_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `play`
--

DROP TABLE IF EXISTS `play`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `play` (
  `username` varchar(20) NOT NULL,
  `game_id` int(11) NOT NULL,
  `accumulate_play_time` time DEFAULT NULL,
  PRIMARY KEY (`username`,`game_id`),
  KEY `FK_Play_Game` (`game_id`),
  CONSTRAINT `FK_Play_Game` FOREIGN KEY (`game_id`) REFERENCES `game` (`game_id`) ON DELETE CASCADE,
  CONSTRAINT `FK_Play_User` FOREIGN KEY (`username`) REFERENCES `User` (`username`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `play`
--

LOCK TABLES `play` WRITE;
/*!40000 ALTER TABLE `play` DISABLE KEYS */;
INSERT INTO `play` VALUES
('alex_dev',3,NULL),
('jane_smith',2,NULL),
('john_doe',1,NULL),
('john_doe',2,NULL),
('sarah_pub',1,NULL),
('sarah_pub',3,NULL),
('toonzzzrock3',3,'00:01:59');
/*!40000 ALTER TABLE `play` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `publisher`
--

DROP TABLE IF EXISTS `publisher`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `publisher` (
  `username` varchar(20) NOT NULL,
  `account_name` varchar(70) DEFAULT NULL,
  `bank_account_serial` varchar(64) DEFAULT NULL,
  PRIMARY KEY (`username`),
  CONSTRAINT `FK_Publisher_User` FOREIGN KEY (`username`) REFERENCES `User` (`username`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `publisher`
--

LOCK TABLES `publisher` WRITE;
/*!40000 ALTER TABLE `publisher` DISABLE KEYS */;
INSERT INTO `publisher` VALUES
('jane_smith','Creative Gaming Labs',NULL),
('sarah_pub','Amazing Games Studio',NULL),
('toonzzzrock3','test','2222');
/*!40000 ALTER TABLE `publisher` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reply`
--

DROP TABLE IF EXISTS `reply`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `reply` (
  `thread_name` varchar(70) NOT NULL,
  `username` varchar(20) NOT NULL,
  `comment_id` int(11) NOT NULL,
  `reply_to_comment_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`thread_name`,`username`,`comment_id`),
  KEY `FK_Reply_User` (`username`),
  KEY `FK_Reply_Comment` (`comment_id`),
  KEY `FK_Reply_ReplyToComment` (`reply_to_comment_id`),
  CONSTRAINT `FK_Reply_Comment` FOREIGN KEY (`comment_id`) REFERENCES `comment` (`comment_id`) ON DELETE CASCADE,
  CONSTRAINT `FK_Reply_Forum` FOREIGN KEY (`thread_name`) REFERENCES `forum` (`thread_name`) ON DELETE CASCADE,
  CONSTRAINT `FK_Reply_ReplyToComment` FOREIGN KEY (`reply_to_comment_id`) REFERENCES `comment` (`comment_id`) ON DELETE CASCADE,
  CONSTRAINT `FK_Reply_User` FOREIGN KEY (`username`) REFERENCES `User` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reply`
--

LOCK TABLES `reply` WRITE;
/*!40000 ALTER TABLE `reply` DISABLE KEYS */;
INSERT INTO `reply` VALUES
('btuh','toonzzzrock3',11,NULL),
('btuh','toonzzzrock3',12,NULL),
('Racing Champions League','patipat',4,NULL),
('Racing Champions League','patipat',8,NULL),
('Racing Champions League','toonzzzrock3',10,NULL),
('stst','patipat',9,NULL),
('Welcome to Space Explorer','john_doe',1,NULL),
('Mystery Manor Strategies','jane_smith',2,1),
('Racing Champions League','alex_dev',3,2),
('Racing Champions League','patipat',5,3),
('Racing Champions League','patipat',6,5),
('Racing Champions League','patipat',7,5);
/*!40000 ALTER TABLE `reply` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `report`
--

DROP TABLE IF EXISTS `report`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `report` (
  `username` varchar(20) NOT NULL,
  `game_id` int(11) NOT NULL,
  `report_topic` enum('Lag','Disconnect','Bug') NOT NULL,
  `detail` varchar(255) DEFAULT NULL,
  `report_time` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`username`,`game_id`),
  KEY `FK_Report_Game` (`game_id`),
  CONSTRAINT `FK_Report_Game` FOREIGN KEY (`game_id`) REFERENCES `game` (`game_id`),
  CONSTRAINT `FK_Report_User` FOREIGN KEY (`username`) REFERENCES `User` (`username`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `report`
--

LOCK TABLES `report` WRITE;
/*!40000 ALTER TABLE `report` DISABLE KEYS */;
INSERT INTO `report` VALUES
('alex_dev',3,'Disconnect','Random disconnections during races','2024-09-02 11:45:00'),
('jane_smith',2,'Lag','Experiencing delays in multiplayer','2024-07-17 09:15:00'),
('john_doe',1,'Bug','Character gets stuck in corner','2024-06-03 17:30:00'),
('toonzzzrock3',3,'Bug','hate this game','2025-11-12 15:31:18');
/*!40000 ALTER TABLE `report` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `session`
--

DROP TABLE IF EXISTS `session`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `session` (
  `session_id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(20) NOT NULL,
  `last_login_time` datetime NOT NULL DEFAULT current_timestamp(),
  `device` varchar(50) NOT NULL,
  PRIMARY KEY (`session_id`),
  KEY `FK_Session_User` (`username`),
  CONSTRAINT `FK_Session_User` FOREIGN KEY (`username`) REFERENCES `User` (`username`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `session`
--

LOCK TABLES `session` WRITE;
/*!40000 ALTER TABLE `session` DISABLE KEYS */;
INSERT INTO `session` VALUES
(1,'john_doe','2024-06-02 13:45:00','Windows PC'),
(2,'jane_smith','2024-07-16 15:30:00','MacBook Pro'),
(3,'alex_dev','2024-09-01 10:15:00','Linux Workstation'),
(4,'john_doe','2024-06-05 19:20:00','iPhone 13'),
(5,'sarah_pub','2024-07-20 14:10:00','Android Tablet');
/*!40000 ALTER TABLE `session` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tag`
--

DROP TABLE IF EXISTS `tag`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `tag` (
  `tag_name` enum('Fantasy','RPG','FPS','MOBA','RTS') NOT NULL,
  `game_id` int(11) NOT NULL,
  PRIMARY KEY (`tag_name`),
  KEY `FK_Tag_Game` (`game_id`),
  CONSTRAINT `FK_Tag_Game` FOREIGN KEY (`game_id`) REFERENCES `game` (`game_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tag`
--

LOCK TABLES `tag` WRITE;
/*!40000 ALTER TABLE `tag` DISABLE KEYS */;
INSERT INTO `tag` VALUES
('Fantasy',1),
('RPG',2),
('RTS',3);
/*!40000 ALTER TABLE `tag` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `update_version_relation`
--

DROP TABLE IF EXISTS `update_version_relation`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `update_version_relation` (
  `game_id` int(11) NOT NULL,
  `update_id` int(11) NOT NULL,
  `username` varchar(20) NOT NULL,
  PRIMARY KEY (`game_id`,`update_id`,`username`),
  KEY `FK_Update_Version_Relation_Game_Update_History` (`update_id`),
  KEY `FK_Update_Version_Relation_Publisher` (`username`),
  CONSTRAINT `FK_Update_Version_Relation_Game` FOREIGN KEY (`game_id`) REFERENCES `game` (`game_id`) ON DELETE CASCADE,
  CONSTRAINT `FK_Update_Version_Relation_Game_Update_History` FOREIGN KEY (`update_id`) REFERENCES `game_update_history` (`update_id`) ON DELETE CASCADE,
  CONSTRAINT `FK_Update_Version_Relation_Publisher` FOREIGN KEY (`username`) REFERENCES `publisher` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `update_version_relation`
--

LOCK TABLES `update_version_relation` WRITE;
/*!40000 ALTER TABLE `update_version_relation` DISABLE KEYS */;
INSERT INTO `update_version_relation` VALUES
(1,1,'sarah_pub'),
(2,2,'jane_smith'),
(3,3,'sarah_pub');
/*!40000 ALTER TABLE `update_version_relation` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*M!100616 SET NOTE_VERBOSITY=@OLD_NOTE_VERBOSITY */;

-- Dump completed on 2025-11-12 20:14:01
