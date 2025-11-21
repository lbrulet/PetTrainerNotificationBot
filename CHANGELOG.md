# Changelog

## [3.0.0] - Multi-User Support

### Breaking Changes
- **Database schema updated** - Added `user_id` column
- **Primary key changed** from `npc_type` to `(user_id, npc_type)`
- Automatic migration for existing single-user databases

### Added
- **Multi-user support** - Each user has their own 3 NPCs (C, B, A)
- **User-specific data isolation** - Users only see their own trainings
- **User-specific notifications** - Reminders sent only to the training owner
- **Automatic database migration** - Old databases automatically upgraded
- New function: `getUserTrainings(userId)` - Get trainings for specific user
- Migration logic in `databaseService.ts`

### Changed
- All database functions now require `userId` parameter
- Scheduler sends notifications to specific users instead of broadcast
- `/status` command shows only the user's own trainings
- Each user must run `/start` to initialize their own NPCs

### Migration
- Existing databases are automatically migrated on startup
- Old data is assigned to `OWNER_TELEGRAM_ID` from environment
- No manual intervention required for existing users

---

## [2.1.0] - Automatic Test Mode

### Added
- **Automatic test mode activation** via environment variable
- New npm scripts:
  - `npm run dev` - Development with test mode enabled (default)
  - `npm run dev:prod` - Development with production timers
  - `npm run start:test` - Production build with test mode
- Test mode indicator on bot startup
- Updated documentation with test mode scripts

### Changed
- `npm run dev` now automatically enables test mode
- Test mode can be set via `TEST_MODE=true` environment variable
- Improved developer experience for local testing

---

## [2.0.0] - SQLite Migration

### Breaking Changes
- **Migrated from Google Sheets to SQLite**
  - Removed all Google Sheets API dependencies
  - Simplified environment configuration (only 2 variables needed)
  - Database now stored locally in `training.db`

### Added
- SQLite database with `better-sqlite3` (v11.7.0)
- `databaseService.ts` - New database service layer
- `MIGRATION.md` - Migration guide for existing users
- Database management section in README
- Auto-initialization of database schema

### Removed
- `googleapis` dependency
- `sheetsService.ts` file
- Google Cloud configuration requirements
- Environment variables:
  - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
  - `GOOGLE_PRIVATE_KEY`
  - `GOOGLE_SPREADSHEET_ID`

### Changed
- All service imports now point to `databaseService.ts`
- Synchronous database operations (no more async/await for DB calls)
- Simplified setup process (no Google Cloud setup needed)
- Updated `.gitignore` to exclude database files

### Performance Improvements
- ⚡ Instant database operations (no network latency)
- 🚀 No API rate limits
- 💪 Better data integrity with ACID transactions

### Migration
See `MIGRATION.md` for detailed migration instructions.

---

## [1.0.0] - Initial Release

### Features
- Track multiple NPC trainers (C, B, A types)
- Automatic training completion reminders
- Interactive buttons for training management
- Google Sheets integration for data storage
- Multi-user authorization support
- NPC rental management with expiration tracking
- Auto-pause training when rental expires
- Test mode for rapid local testing
- Smart training validation (partial progress calculation)
