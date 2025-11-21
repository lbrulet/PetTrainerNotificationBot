# Migration from Google Sheets to SQLite

This document describes the migration from Google Sheets to SQLite database.

## What Changed

### ✅ Removed
- `googleapis` dependency
- `sheetsService.ts` file
- Google Sheets API configuration
- Environment variables:
  - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
  - `GOOGLE_PRIVATE_KEY`
  - `GOOGLE_SPREADSHEET_ID`

### ✅ Added
- `better-sqlite3` dependency (v11.7.0 for Node 18 compatibility)
- `@types/better-sqlite3` dev dependency
- `databaseService.ts` - New SQLite service
- `training.db` - SQLite database file (auto-created)

### ✅ Modified
- `index.ts` - Added database initialization
- `botCommands.ts` - Updated imports to use `databaseService`
- `callbackHandlers.ts` - Updated imports to use `databaseService`
- `scheduler.ts` - Updated imports to use `databaseService`
- `.gitignore` - Added database files
- `README.md` - Updated setup instructions

## Benefits

### Performance
- ⚡ **Instant operations** - No network latency
- 🚀 **No rate limits** - Unlimited queries
- 💪 **ACID transactions** - Data integrity guaranteed

### Simplicity
- 🔧 **Easier setup** - No Google Cloud configuration needed
- 📦 **Single dependency** - Just `better-sqlite3`
- 🎯 **Local file** - Everything in one place

### Reliability
- 🛡️ **More stable** - No API downtime or network issues
- 🔒 **Better concurrency** - SQLite handles it natively
- 📊 **Simpler debugging** - Direct SQL queries

## Migration Steps for Existing Users

If you were using the Google Sheets version:

### 1. Backup Your Data (Optional)

If you want to preserve your training data, export it from Google Sheets first.

### 2. Update Dependencies

```bash
npm install
```

This will automatically install `better-sqlite3` and remove `googleapis`.

### 3. Update Environment Variables

Edit your `.env` file and remove Google Sheets variables:

**Before:**
```env
TELEGRAM_BOT_TOKEN=...
OWNER_TELEGRAM_ID=...
GOOGLE_SERVICE_ACCOUNT_EMAIL=...
GOOGLE_PRIVATE_KEY=...
GOOGLE_SPREADSHEET_ID=...
```

**After:**
```env
TELEGRAM_BOT_TOKEN=...
OWNER_TELEGRAM_ID=...
```

### 4. Rebuild and Run

```bash
npm run build
npm start
```

The SQLite database will be created automatically on first run.

### 5. Reinitialize Data

Run `/start` in Telegram to initialize the default NPC rows.

## Data Structure

The SQLite schema matches the previous Google Sheets structure:

```sql
CREATE TABLE trainings (
  npc_type TEXT PRIMARY KEY,
  start_iso TEXT,
  duration_hours REAL,
  end_iso TEXT,
  is_active INTEGER DEFAULT 0,
  last_notified_iso TEXT,
  npc_rental_start_iso TEXT,
  npc_rental_end_iso TEXT,
  rental_expiry_notified_iso TEXT
)
```

## Viewing the Database

Use any SQLite client:

```bash
# Command line
sqlite3 training.db
SELECT * FROM trainings;

# Or use GUI tools like DB Browser for SQLite
```

## Rollback (If Needed)

If you need to go back to Google Sheets:

```bash
git checkout <previous-commit-hash>
npm install
```

Then restore your `.env` with Google Sheets credentials.

## Notes

- The database file (`training.db`) is automatically created in the project root
- Database is automatically backed up by SQLite's WAL mode
- No manual schema migrations needed - schema is created on first run
- All bot functionality remains identical - only the storage backend changed

