# Quick Start Guide 🚀

Get your Pet Training Bot running in 5 minutes!

## 1. Prerequisites ✅

- Node.js 18+ installed
- A Telegram account

## 2. Setup (2 minutes) ⚙️

### Get your Telegram Bot Token

1. Open Telegram and search for [@BotFather](https://t.me/botfather)
2. Send `/newbot` and follow instructions
3. Copy your bot token

### Get your Telegram User ID

1. Search for [@userinfobot](https://t.me/userinfobot)
2. Start a chat
3. Copy your numeric user ID

### Configure the bot

```bash
# Clone and install
git clone <your-repo>
cd PetTrainerNotificationBot
npm install

# Create .env file
cp .env.example.new .env
```

Edit `.env`:
```env
TELEGRAM_BOT_TOKEN=paste_your_bot_token_here
OWNER_TELEGRAM_ID=paste_your_user_id_here
```

## 3. Run (1 minute) 🏃

### For Development (with fast test timers)

```bash
npm run dev
```

**Test mode timers:**
- Training: C=1min, B=2min, A=3min
- Checks every 10 seconds
- Perfect for testing!

### For Production (real timers)

```bash
npm run build
npm start
```

**Production timers:**
- Training: C=50h, B=75h, A=250h
- Checks every minute

## 4. Use the Bot (2 minutes) 💬

Open Telegram and find your bot, then:

```
/start              # Initialize the bot
/rental_c           # Rent NPC C for 15 days
/train_c            # Start training (1 min in test mode!)
```

Wait 1 minute and you'll get a notification! 🎉

## Available Commands

### Setup
- `/start` - Initialize bot
- `/status` - Check all NPCs

### Training (per NPC)
- `/train_c` / `/train_b` / `/train_a` - Start training
- `/stop_c` / `/stop_b` / `/stop_a` - Stop training

### Rental (per NPC)
- `/rental_c` / `/rental_b` / `/rental_a` - Set 15-day rental

### Testing
- `/testmode` - Toggle test mode on/off

## Tips 💡

**Development workflow:**
```bash
# Start with test mode for quick testing
npm run dev

# Test a full cycle in ~3 minutes:
/start
/rental_c
/train_c
# Wait 1 minute for notification
```

**Production deployment:**
```bash
npm run build
npm start

# Or with PM2:
pm2 start npm --name "pet-trainer-bot" -- start
```

## Troubleshooting 🔧

**Bot doesn't respond?**
- Check your `TELEGRAM_BOT_TOKEN` is correct
- Verify `OWNER_TELEGRAM_ID` matches your Telegram user ID

**"Not authorized" message?**
- Make sure you're using the correct Telegram account
- Check your user ID with [@userinfobot](https://t.me/userinfobot)

**Want to reset everything?**
```bash
rm training.db
npm start
/start
```

## Next Steps 📚

- Read [README.md](README.md) for detailed documentation
- Check [MIGRATION.md](MIGRATION.md) if upgrading from Google Sheets
- See [CHANGELOG.md](CHANGELOG.md) for version history

Happy training! 🐾

