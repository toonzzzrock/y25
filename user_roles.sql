-- User Roles and Permissions for Y25_DB
-- This file defines three user roles with specific privileges

USE Y25_DB;

-- =====================================================
-- CREATE USERS/ROLES
-- =====================================================

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
