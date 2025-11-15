# Routes Converted to Stored Procedures

## Completed ✓
- [x] /api/publisher/dashboard
- [x] /api/publisher/reports
- [x] /api/games (list)
- [x] /api/games/[id] (detail)
- [x] /api/auth/check-username
- [x] /api/auth/check-email
- [x] /api/auth/login
- [x] /api/auth/signup
- [x] /api/play
- [x] /api/games/delete
- [x] /api/games/upload

## Pending Routes to Convert

### Games Routes
- [ ] /api/games/trending - USE: sp_get_trending_games
- [ ] /api/games/search - USE: sp_search_games
- [ ] /api/games/new - USE: sp_get_new_games, sp_count_new_games
- [ ] /api/games/all - USE: sp_get_all_games, sp_count_games
- [ ] /api/games/report - USE: sp_check_game_exists, sp_create_game_report
- [ ] /api/games/category/[categoryId] - USE: sp_get_games_by_tag, sp_count_games_by_tag

### Publisher Routes
- [ ] /api/publisher/games/[id]/edit - USE: sp_update_game_details

### User Routes
- [ ] /api/users/profile (GET) - USE: sp_get_user_profile, sp_get_user_playtime, sp_get_user_total_playtime
- [ ] /api/users/profile (PUT) - USE: sp_check_email_exists, sp_update_user_profile
- [ ] /api/users/search - USE: sp_search_users

### Forum Routes
- [ ] /api/forum/threads (GET) - USE: sp_get_forum_threads
- [ ] /api/forum/threads (POST) - USE: sp_check_thread_exists, sp_check_game_for_thread, sp_create_forum_thread
- [ ] /api/forum/threads/[threadName] (GET) - USE: sp_get_thread_details, sp_get_thread_replies
- [ ] /api/forum/threads/[threadName] (POST) - USE: sp_check_reply_to_comment, sp_create_comment, sp_create_reply
- [ ] /api/forum/search - USE: sp_search_forum_threads
- [ ] /api/forum/user-threads - USE: sp_get_user_created_threads, sp_get_user_commented_threads

## Manual Conversion Instructions

For each route, follow this pattern:

1. Change import:
   ```typescript
   // FROM
   import { pool } from '@/lib/db';
   
   // TO
   import { callProcedure } from '@/lib/db';
   ```

2. Replace query calls:
   ```typescript
   // FROM
   const connection = await pool.getConnection();
   try {
     const [rows] = await connection.query('SELECT ...', [params]);
   } finally {
     connection.release();
   }
   
   // TO
   const rows = await callProcedure<any[]>('sp_procedure_name', [params]);
   ```

3. Test the route after conversion

## Database Setup Required

Run these SQL files in order:
1. `stack/procedures.sql` - Creates all procedures
2. `sql/create_app_user.sql` - Creates restricted user
3. Update `.env.local` to use `y25_app` user

## Verification

```powershell
# Test that app user can only execute procedures
mysql -u y25_app -p Y25_DB
> SELECT * FROM User;  # Should fail
> CALL sp_get_user_profile('testuser');  # Should work
```
