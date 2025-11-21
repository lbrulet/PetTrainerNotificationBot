# Multi-User Migration Guide

## Overview

Version 3.0.0 introduces multi-user support! Each user now has their own independent set of 3 NPCs (C, B, A).

## What Changed

### Database Schema
- Added `user_id` column to the `trainings` table
- Primary key changed from `npc_type` to `(user_id, npc_type)`
- Each user has their own isolated data

### Behavior Changes
- **Notifications**: Sent only to the user who owns the training (not broadcast)
- **Status**: `/status` shows only your own trainings
- **Initialization**: Each user must run `/start` to create their NPCs

## Automatic Migration

**Good news**: Migration is automatic! 🎉

When you start the bot with version 3.0.0:

1. The bot detects the old database structure
2. Automatically migrates your data
3. Assigns existing trainings to `OWNER_TELEGRAM_ID`
4. You can continue using the bot immediately

### Migration Process

```
Old Database (v2.x):
┌──────────┬────────────┬─────────┐
│ npc_type │ is_active  │ ...     │
├──────────┼────────────┼─────────┤
│ C        │ 1          │ ...     │
│ B        │ 0          │ ...     │
│ A        │ 0          │ ...     │
└──────────┴────────────┴─────────┘

↓ Automatic Migration ↓

New Database (v3.0.0):
┌─────────┬──────────┬────────────┬─────────┐
│ user_id │ npc_type │ is_active  │ ...     │
├─────────┼──────────┼────────────┼─────────┤
│ 7172... │ C        │ 1          │ ...     │
│ 7172... │ B        │ 0          │ ...     │
│ 7172... │ A        │ 0          │ ...     │
└─────────┴──────────┴────────────┴─────────┘
```

## For New Users

New users joining the bot:

1. Send `/start` to the bot
2. Bot creates 3 NPCs (C, B, A) for you
3. Start using commands like `/train_c`, `/rental_b`, etc.

## For Existing Users

If you were using the bot before v3.0.0:

1. **Update the bot** to v3.0.0
2. **Start the bot** - Migration happens automatically
3. **No action needed** - Your data is preserved!

Your existing trainings will be assigned to your user ID from `OWNER_TELEGRAM_ID`.

## Adding New Users

To add a new user to the bot:

### 1. Update Authorization List

Edit `src/types.ts`:

```typescript
export const AUTHORIZED_USERS = [
  7172542482,  // Luc (owner)
  7860400654,  // Authorized user
  123456789,   // New user ID
];
```

### 2. Rebuild and Restart

```bash
npm run build
npm start
```

### 3. New User Initialization

The new user should:
1. Find the bot on Telegram
2. Send `/start`
3. Bot creates their 3 NPCs
4. They can now use all commands!

## Viewing Multi-User Data

### In DataGrip/DB Browser

```sql
-- See all users and their trainings
SELECT 
  user_id,
  npc_type,
  is_active,
  datetime(npc_rental_end_iso) as rental_expires
FROM trainings
ORDER BY user_id, npc_type;

-- See specific user's trainings
SELECT * FROM trainings WHERE user_id = 7172542482;

-- Count trainings per user
SELECT user_id, COUNT(*) as npc_count
FROM trainings
GROUP BY user_id;
```

## Troubleshooting

### Migration Failed

If you see `❌ Migration failed` in logs:

1. **Backup your database**:
   ```bash
   cp training.db training.db.backup
   ```

2. **Check environment**:
   - Ensure `OWNER_TELEGRAM_ID` is set in `.env`
   - Verify it's a valid number

3. **Manual migration** (if needed):
   ```bash
   # Delete database and start fresh
   rm training.db
   npm start
   /start  # Initialize your NPCs
   ```

### User Can't See Their Data

If a user can't see their trainings:

1. **Check authorization**:
   - Verify user ID is in `AUTHORIZED_USERS` array
   - Rebuild: `npm run build`

2. **Initialize NPCs**:
   - User should run `/start`
   - This creates their 3 NPCs

3. **Check database**:
   ```sql
   SELECT * FROM trainings WHERE user_id = <their_user_id>;
   ```

### Wrong User Receiving Notifications

This shouldn't happen with v3.0.0, but if it does:

1. **Check database**:
   ```sql
   SELECT user_id, npc_type, is_active 
   FROM trainings 
   WHERE is_active = 1;
   ```

2. **Verify ownership**:
   - Each training should have correct `user_id`
   - Notifications go only to that user

## Benefits of Multi-User

### Before (v2.x)
- ❌ Only one user could use the bot
- ❌ All notifications sent to everyone
- ❌ Shared data between users

### After (v3.0.0)
- ✅ Multiple users can use the bot
- ✅ Notifications sent only to owner
- ✅ Complete data isolation
- ✅ Each user has their own 3 NPCs
- ✅ Independent training schedules

## Example Scenarios

### Scenario 1: Two Friends Using the Bot

**User A (ID: 7172542482)**:
- Has NPC C training (active)
- Has NPC B rental (15 days left)
- Receives only their own notifications

**User B (ID: 7860400654)**:
- Has NPC A training (active)
- Has NPC C rental (5 days left)
- Receives only their own notifications

Both users use the same bot, but their data is completely separate!

### Scenario 2: Family Bot

Parents and kids can all use the same bot:
- Each person runs `/start` once
- Everyone manages their own NPCs
- No confusion about whose training is done
- Each person gets their own reminders

## Technical Details

### Database Changes

```sql
-- Old schema (v2.x)
CREATE TABLE trainings (
  npc_type TEXT PRIMARY KEY,
  ...
)

-- New schema (v3.0.0)
CREATE TABLE trainings (
  user_id INTEGER NOT NULL,
  npc_type TEXT NOT NULL,
  ...,
  PRIMARY KEY (user_id, npc_type)
)
```

### Code Changes

All database functions now require `userId`:

```typescript
// Before
startTraining(npcType)
stopTraining(npcType)
getTraining(npcType)

// After
startTraining(userId, npcType)
stopTraining(userId, npcType)
getTraining(userId, npcType)
```

## Questions?

- Check the main [README.md](README.md) for usage
- See [CHANGELOG.md](CHANGELOG.md) for version history
- Review [MIGRATION.md](MIGRATION.md) for SQLite migration

Happy training! 🐾

