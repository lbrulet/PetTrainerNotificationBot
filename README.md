# Pet Training Notification Bot 🐾

A Telegram bot that helps manage NPC pet trainers in a game using SQLite as a database. The bot tracks training timers and sends reminders when pets complete their training.

## Features

- **Multi-user support** - Each user has their own 3 NPCs (C, B, A)
- **Track multiple NPC trainers** (C, B, and A types per user)
- **Automatic reminders** when training completes (sent to the specific user)
- **Interactive buttons** to reset or stop training
- **SQLite database** for fast, reliable local storage
- **User-specific data** - Each user's trainings are completely independent
- **NPC rental management** with automatic expiration tracking
- **Auto-pause training** when NPC rental expires
- **Test mode** for rapid local testing
- **Training duration tracking**:
  - NPC C: 50 hours (trains C pets)
  - NPC B: 75 hours (trains B pets)
  - NPC A: 250 hours (trains A pets)

## Prerequisites

- Node.js (LTS version, 18.x or higher)
- npm or pnpm
- A Telegram bot token (from [@BotFather](https://t.me/botfather))

## Setup

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd PetTrainerNotificationBot
npm install
```

### 2. Create a Telegram Bot

1. Open Telegram and search for [@BotFather](https://t.me/botfather)
2. Send `/newbot` and follow the instructions
3. Copy the bot token you receive

### 3. Get Your Telegram User ID

1. Search for [@userinfobot](https://t.me/userinfobot) on Telegram
2. Start a chat with it
3. Copy your numeric user ID

### 4. Configure Environment Variables

1. Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

2. Edit `.env` and fill in your values:

```env
TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather
OWNER_TELEGRAM_ID=your_telegram_user_id
```

### 5. Run the Bot

#### Development mode with test mode (accelerated timers):

```bash
npm run dev
```
This automatically enables test mode with faster durations:
- Training: C=1min, B=2min, A=3min
- Scheduler checks every 10 seconds
- Rental warnings 1 minute before expiry

#### Development mode without test mode:

```bash
npm run dev:prod
```

#### Production mode:

```bash
npm run build
npm start
```

#### Production mode with test mode:

```bash
npm run build
npm run start:test
```

## Usage

### Commands

#### Basic Commands
- **`/start`** - Initialize the bot and show all available commands
- **`/status`** - Check current training and rental status for all NPCs
- **`/testmode`** - Toggle test mode on/off (can also be set via `npm run dev`)

#### Training Commands (one per NPC type)
- **`/train_c`** - Start training for NPC C (50 hours)
- **`/train_b`** - Start training for NPC B (75 hours)
- **`/train_a`** - Start training for NPC A (250 hours)

#### Stop Training Commands
- **`/stop_c`** - Stop training for NPC C
- **`/stop_b`** - Stop training for NPC B
- **`/stop_a`** - Stop training for NPC A

#### NPC Rental Commands
- **`/rental_c`** - Set/renew NPC C rental (15 days)
- **`/rental_b`** - Set/renew NPC B rental (15 days)
- **`/rental_a`** - Set/renew NPC A rental (15 days)

### Workflow

1. **Set NPC rental**: `/rental_c` (required before training)
2. **Start training**: `/train_c`
3. **Check status**: `/status`
4. **Wait for reminder**: The bot will send a message when training completes
5. **Choose action**: Click "Reset training" to start a new cycle or "Stop tracking" to deactivate

> **Note**: You cannot start training if the NPC rental has expired or is not set. The bot will automatically pause any active training when the rental expires.

### Interactive Buttons

When training completes, you'll receive a reminder with two buttons:

- **🔄 Reset training** - Starts a new training cycle immediately
- **⏹️ Stop tracking** - Deactivates training for that NPC

## Project Structure

```
PetTrainerNotificationBot/
├── src/
│   ├── index.ts              # Main entry point
│   ├── types.ts              # TypeScript types and constants
│   ├── timeUtils.ts          # Time calculation utilities
│   ├── sheetsService.ts      # Google Sheets integration
│   ├── scheduler.ts          # Training reminder scheduler
│   ├── botCommands.ts        # Command handlers
│   └── callbackHandlers.ts  # Inline button handlers
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## Database Structure

The bot uses SQLite with a `trainings` table containing the following columns:

| Column | Type | Description |
|--------|------|-------------|
| `user_id` | INTEGER | Telegram user ID - Part of PRIMARY KEY |
| `npc_type` | TEXT | NPC type (C, B, or A) - Part of PRIMARY KEY |
| `start_iso` | TEXT | Training start time (ISO format) |
| `duration_hours` | REAL | Training duration in hours |
| `end_iso` | TEXT | Training end time (ISO format) |
| `is_active` | INTEGER | Whether training is active (0/1) |
| `last_notified_iso` | TEXT | Last notification time |
| `npc_rental_start_iso` | TEXT | NPC rental start time |
| `npc_rental_end_iso` | TEXT | NPC rental end time |
| `rental_expiry_notified_iso` | TEXT | When rental expiry warning was sent |

**Primary Key**: `(user_id, npc_type)` - Each user has their own set of 3 NPCs

### Multi-User Support

- Each user has their own independent set of 3 NPCs (C, B, A)
- Users only see and manage their own trainings
- Reminders are sent only to the user who owns the training
- Data is completely isolated between users
- Each new user must run `/start` to initialize their NPCs

## Game Information

- **NPC Cost**: 140 FCOINS per NPC
- **Rental Period**: 15 days
- **Training Durations & Progress**:
  - **NPC C**: 50 hours total (4% every 2 hours)
  - **NPC B**: 75 hours total (4% every 3 hours)
  - **NPC A**: 250 hours total (2% every 5 hours)

### Rental Management

The bot automatically manages NPC rentals with intelligent time validation:
- **Smart validation**: Allows training if at least one cycle can complete (minimum 2h for C, 3h for B, 5h for A)
- **Progress calculation**: Shows how much % you'll gain if rental expires mid-training
- **Warning notification**: Sent 24 hours before rental expires
- **Auto-pause**: Training is automatically paused when rental expires
- **Status tracking**: Use `/status` to see rental expiration times and potential progress

#### Example: Partial Training
If NPC C rental expires in 48 hours but training takes 50 hours:
- ✅ Training is allowed (48h > 2h minimum)
- You'll complete 24 cycles (48h ÷ 2h)
- You'll gain 96% progress (24 cycles × 4%)
- Bot will notify you of the expected progress

## Database Management

### Viewing the Database

You can view and edit the SQLite database using various tools:

**Command Line:**
```bash
sqlite3 training.db
.tables
SELECT * FROM trainings;
.quit
```

**GUI Tools:**
- [DB Browser for SQLite](https://sqlitebrowser.org/) (Free, cross-platform)
- [TablePlus](https://tableplus.com/) (Free tier available)
- [DBeaver](https://dbeaver.io/) (Free, open-source)

### Backup

Simply copy the `training.db` file:
```bash
cp training.db training.db.backup
```

### Reset Database

To start fresh, delete the database file (it will be recreated on next run):
```bash
rm training.db
```

## Troubleshooting

### Bot doesn't respond

- Check that the bot is running (`npm run dev` or `npm start`)
- Verify your `TELEGRAM_BOT_TOKEN` is correct
- Make sure you're using the correct `OWNER_TELEGRAM_ID`

### Database errors

- Check that the `training.db` file is not locked by another process
- Ensure the bot has write permissions in the project directory
- If database is corrupted, delete `training.db` and restart the bot

### "Not authorized" message

- Make sure you're using the correct `OWNER_TELEGRAM_ID`
- Get your user ID from [@userinfobot](https://t.me/userinfobot)

## Development

### Scripts

- `npm run dev` - Development mode with **test mode enabled** (auto-reload)
- `npm run dev:prod` - Development mode with **production timers** (auto-reload)
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Run compiled JavaScript (production mode)
- `npm run start:test` - Run compiled JavaScript with **test mode enabled**

### Test Mode

Test mode accelerates all timers for rapid local testing:

**Automatic activation:**
```bash
npm run dev  # Test mode ON by default
```

**Manual toggle:**
- Use `/testmode` command in Telegram
- Or set `TEST_MODE=true` environment variable

**Test mode timers:**
- 🏃 NPC C training: 1 minute (vs 50 hours)
- 🏃 NPC B training: 2 minutes (vs 75 hours)
- 🏃 NPC A training: 3 minutes (vs 250 hours)
- 🏃 NPC rental: 30 minutes (vs 15 days)
- 🏃 Scheduler: checks every 10 seconds (vs 1 minute)
- 🏃 Rental warning: 1 minute before expiry (vs 24 hours)

### Tech Stack

- **TypeScript** - Type-safe JavaScript
- **Node.js** - Runtime environment
- **node-telegram-bot-api** - Telegram Bot API wrapper
- **google-spreadsheet** - Google Sheets API wrapper
- **dotenv** - Environment variable management

## License

ISC

## Support

For issues or questions, please open an issue on the GitHub repository.

