# Architecture Documentation 🏗️

## Project Overview

This is a Telegram bot that manages pet training timers for a game using Google Sheets as a persistent database. The bot is designed as a single-user application with owner authorization.

## Technology Stack

- **Runtime**: Node.js (LTS)
- **Language**: TypeScript
- **Telegram Library**: node-telegram-bot-api
- **Database**: Google Sheets API v4
- **Environment**: dotenv

## Module Structure

### Core Modules

#### `types.ts`
Defines all TypeScript types and constants used throughout the application.

**Key Types:**
- `NpcType`: Union type for NPC types ('C' | 'B' | 'A')
- `TrainingRow`: Interface for training data structure

**Constants:**
- `TRAINING_DURATIONS`: Training hours for each NPC type
- `NPC_RENTAL_DAYS`: Rental period (15 days)
- `SCHEDULER_INTERVAL_MS`: Reminder check interval (2 minutes)
- `SHEET_HEADERS`: Column names for Google Sheets
- `SHEET_TAB_NAME`: Name of the sheet tab ('training')

#### `timeUtils.ts`
Utility functions for time calculations and formatting.

**Functions:**
- `calculateEndTime()`: Calculates end time from start + duration
- `formatRemainingTime()`: Formats time as "2d 5h 30m"
- `formatDate()`: Formats ISO date to readable format
- `isTrainingFinished()`: Checks if training is complete
- `getCurrentIso()`: Gets current time in ISO format
- `addDays()`: Adds days to a date

#### `sheetsService.ts`
Google Sheets integration layer - handles all database operations.

**Key Functions:**
- `getAllTrainings()`: Fetch all training rows
- `getTrainingByType()`: Fetch specific NPC training
- `initializeDefaultRows()`: Create default rows for C, B, A
- `upsertTrainingRow()`: Update or insert training data
- `startTraining()`: Start new training cycle
- `stopTraining()`: Deactivate training
- `markAsNotified()`: Update notification timestamp
- `setNpcRental()`: Set NPC rental period

**Design Patterns:**
- Singleton pattern for sheet connection (cached)
- Row mapping functions for data transformation
- Error handling with meaningful messages

#### `scheduler.ts`
Background scheduler that checks for completed trainings and sends reminders.

**Key Functions:**
- `startScheduler()`: Initialize periodic training checks
- `stopScheduler()`: Stop the scheduler
- `checkTrainings()`: Check all trainings and send reminders
- `createReminderKeyboard()`: Generate inline keyboard buttons

**Behavior:**
- Runs every 2 minutes (configurable)
- Checks all active trainings
- Sends reminder only once per training completion
- Updates `last_notified_iso` to prevent duplicate reminders

#### `botCommands.ts`
Command handlers for all bot commands.

**Commands:**
- `/start`: Welcome message and initialization
- `/status`: Display current training status
- `/start_training <type> [name]`: Start training
- `/stop_training <type>`: Stop training
- `/set_npc_rental <type>`: Set rental period

**Authorization:**
- All commands check if user ID matches `OWNER_TELEGRAM_ID`
- Unauthorized users receive polite rejection message

#### `callbackHandlers.ts`
Handlers for inline button interactions.

**Callback Data Format:**
- `npc:C:reset` - Reset training for NPC C
- `npc:B:stop` - Stop tracking for NPC B

**Actions:**
- **Reset**: Starts new training cycle immediately
- **Stop**: Deactivates training for that NPC type

**Features:**
- Edits original message with new status
- Answers callback query to stop loading spinner
- Authorization check for owner only

#### `index.ts`
Main entry point that orchestrates all modules.

**Responsibilities:**
- Environment variable validation
- Bot initialization
- Command registration
- Callback query registration
- Scheduler startup
- Error handling
- Graceful shutdown (SIGINT/SIGTERM)

## Data Flow

### Starting Training

```
User sends /start_training C Fluffy
    ↓
botCommands.handleStartTraining()
    ↓
sheetsService.startTraining()
    ↓
Calculate end time (start + 50 hours)
    ↓
Update Google Sheet row
    ↓
Send confirmation to user
```

### Training Completion Flow

```
Scheduler checks every 2 minutes
    ↓
sheetsService.getAllTrainings()
    ↓
For each active training:
  - Check if end_iso <= now
  - Check if not already notified
    ↓
Send Telegram message with inline buttons
    ↓
Update last_notified_iso in sheet
```

### Button Interaction Flow

```
User clicks "Reset training"
    ↓
callbackHandlers.handleCallbackQuery()
    ↓
Parse callback data (npc:C:reset)
    ↓
sheetsService.startTraining()
    ↓
Edit original message with new status
    ↓
Answer callback query
```

## Google Sheets Schema

### Sheet: "training"

| Column | Type | Description |
|--------|------|-------------|
| npc_type | string | 'C', 'B', or 'A' |
| pet_name | string | Optional pet name |
| start_iso | ISO datetime | Training start time |
| duration_hours | number | 50, 75, or 250 |
| end_iso | ISO datetime | Training end time |
| is_active | string | 'TRUE' or 'FALSE' |
| last_notified_iso | ISO datetime | Last notification time |
| npc_rental_start_iso | ISO datetime | Rental start (optional) |
| npc_rental_end_iso | ISO datetime | Rental end (optional) |

**Rows:**
- Exactly 3 rows (one for each NPC type)
- Initialized on first `/start` command
- Updated in place (upsert pattern)

## Security Considerations

1. **Single-User Authorization**: Only `OWNER_TELEGRAM_ID` can use the bot
2. **Environment Variables**: Sensitive data stored in `.env` (not committed)
3. **Service Account**: Google Sheets access via service account (not user OAuth)
4. **Input Validation**: All user inputs validated before processing
5. **Error Handling**: Errors logged but don't expose sensitive information

## Extensibility

### Adding New NPC Types

1. Update `NpcType` in `types.ts`
2. Add duration to `TRAINING_DURATIONS`
3. Update initialization in `sheetsService.ts`
4. Update documentation

### Adding New Commands

1. Create handler in `botCommands.ts`
2. Register command in `index.ts`
3. Update help text in `/start` command
4. Update README.md

### Adding Rental Reminders

1. Add scheduler check for `npc_rental_end_iso`
2. Create reminder message with renewal options
3. Add callback handlers for rental actions

## Performance Considerations

- **Sheet Caching**: Connection and sheet reference cached
- **Batch Operations**: Scheduler checks all trainings in one fetch
- **Polling Interval**: 2 minutes balances responsiveness vs. API calls
- **Minimal API Calls**: Only update sheet when necessary

## Error Handling

- **Environment Validation**: Fails fast on startup if env vars missing
- **Google Sheets Errors**: Logged with context, user gets friendly message
- **Telegram Errors**: Polling errors logged, bot continues running
- **Graceful Shutdown**: Handles SIGINT/SIGTERM for clean exit

## Testing Recommendations

1. **Unit Tests**: Test time utilities and data transformations
2. **Integration Tests**: Test Google Sheets operations
3. **E2E Tests**: Test bot commands with mock Telegram API
4. **Manual Tests**: Test full workflow with real Telegram bot

## Deployment

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

### Process Management (Recommended)
Use PM2 or similar for production:
```bash
pm2 start build/index.js --name pet-trainer-bot
```

## Monitoring

**Key Metrics to Monitor:**
- Bot uptime
- Google Sheets API quota usage
- Scheduler execution success rate
- Command response times
- Error rates

**Logs to Track:**
- Training start/stop events
- Reminder sent events
- Google Sheets connection errors
- Authorization failures

## Future Enhancements

1. **Multi-User Support**: Allow multiple users with separate data
2. **Rental Reminders**: Automatic reminders before NPC rental expires
3. **Statistics**: Track total training time, pets trained, etc.
4. **Backup**: Automatic backup of training data
5. **Web Dashboard**: View training status via web interface
6. **Cost Tracking**: Track FCOIN spending on NPCs
7. **Notifications**: Customizable notification preferences
8. **Time Zones**: Support for different time zones

