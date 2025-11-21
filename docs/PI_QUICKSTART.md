# Raspberry Pi 5 - Quick Start Guide

Get your Pet Training Bot running on Raspberry Pi 5 in under 10 minutes! 🚀

## Prerequisites Checklist

- [ ] Raspberry Pi 5 with Raspberry Pi OS installed
- [ ] Pi connected to your network (WiFi or Ethernet)
- [ ] SSH enabled on Pi
- [ ] Mac connected to same network
- [ ] Telegram bot token from [@BotFather](https://t.me/botfather)
- [ ] Your Telegram user ID from [@userinfobot](https://t.me/userinfobot)

---

## Step 1: Set Up SSH (2 minutes)

### On Your Mac

```bash
# Test connection (replace with your Pi's hostname or IP)
ssh pi@raspberrypi.local

# If that works, set up SSH keys for easier access
ssh-keygen -t ed25519 -C "your_email@example.com"  # Press Enter for defaults
ssh-copy-id pi@raspberrypi.local

# Create SSH config for easy access
cat >> ~/.ssh/config << 'EOF'
Host pi
    HostName raspberrypi.local
    User pi
    IdentityFile ~/.ssh/id_ed25519
EOF

# Now you can just use: ssh pi
ssh pi
```

**Can't connect?** Find your Pi's IP:
- On Pi: `hostname -I`
- Use IP instead: `ssh pi@192.168.1.XXX`

---

## Step 2: Deploy to Pi (5 minutes)

### Option A: Quick Deploy from Mac (Recommended)

```bash
# On your Mac - navigate to project
cd ~/Documents/Perso/PetTrainerNotificationBot

# Copy project to Pi
ssh pi "mkdir -p ~/apps"
rsync -avz --exclude 'node_modules' --exclude 'build' --exclude '.git' --exclude 'training.db' . pi:~/apps/pet-trainer-bot/

# Run setup on Pi
ssh pi "cd ~/apps/pet-trainer-bot && chmod +x scripts/setup-pi.sh && ./scripts/setup-pi.sh"
```

**Follow the prompts** - the script will:
- Install Node.js and PM2
- Install dependencies
- Build the project
- Set up log rotation

### Option B: Manual Setup on Pi

```bash
# SSH into Pi
ssh pi

# Clone repository
mkdir -p ~/apps && cd ~/apps
git clone https://github.com/lbrulet/PetTrainerNotificationBot.git pet-trainer-bot
cd pet-trainer-bot

# Run setup
chmod +x scripts/setup-pi.sh
./scripts/setup-pi.sh
```

---

## Step 3: Configure Bot (1 minute)

```bash
# SSH into Pi (if not already there)
ssh pi
cd ~/apps/pet-trainer-bot

# Create .env file
nano .env
```

**Add your configuration:**

```env
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
OWNER_TELEGRAM_ID=123456789
```

**Save and exit:** Press `Ctrl+X`, then `Y`, then `Enter`

---

## Step 4: Start the Bot (1 minute)

```bash
# Still on Pi
pm2 start ecosystem.config.cjs
pm2 save
pm2 logs pet-trainer-bot
```

**You should see:**
```
🤖 Bot started successfully!
👤 Owner ID: 123456789
```

**Press `Ctrl+C`** to exit logs (bot keeps running)

---

## Step 5: Test the Bot (1 minute)

### On Telegram

1. Open Telegram and find your bot
2. Send `/start`
3. You should get a welcome message with all commands!
4. Try `/status` to check your NPCs

**If it works:** ✅ You're done! The bot is now running 24/7 on your Pi!

**If not:** Check troubleshooting below

---

## Step 6: Set Up Remote Database Access (Optional, 2 minutes)

### On Your Mac

```bash
cd ~/Documents/Perso/PetTrainerNotificationBot

# Make sync script executable
chmod +x scripts/sync-pi-db.sh

# Edit configuration if needed
nano scripts/sync-pi-db.sh
# Update PI_HOST if your Pi has a different hostname

# Test it
./scripts/sync-pi-db.sh status
```

**Now you can:**

```bash
# Pull database from Pi to Mac
./scripts/sync-pi-db.sh pull

# View database locally
sqlite3 training.db "SELECT * FROM trainings;"

# Create backups
./scripts/sync-pi-db.sh backup
```

---

## Essential Commands

### From Your Mac

```bash
# Check bot status
ssh pi "pm2 status"

# View logs
ssh pi "pm2 logs pet-trainer-bot"

# Restart bot
ssh pi "pm2 restart pet-trainer-bot"

# Pull database
./scripts/sync-pi-db.sh pull

# Check database status
./scripts/sync-pi-db.sh status
```

### On the Pi

```bash
# View status
pm2 status

# View logs
pm2 logs pet-trainer-bot

# Restart
pm2 restart pet-trainer-bot

# Stop
pm2 stop pet-trainer-bot

# Interactive monitoring
pm2 monit
```

---

## Troubleshooting

### Bot Won't Start

**Check logs:**
```bash
ssh pi "pm2 logs pet-trainer-bot --err"
```

**Common issues:**

1. **Missing .env file:**
   ```bash
   ssh pi "cat ~/apps/pet-trainer-bot/.env"
   ```

2. **Wrong bot token:**
   - Get new token from [@BotFather](https://t.me/botfather)
   - Update `.env` on Pi

3. **Build failed:**
   ```bash
   ssh pi "cd ~/apps/pet-trainer-bot && npm run build"
   ```

### Bot Not Responding in Telegram

1. **Check bot is running:**
   ```bash
   ssh pi "pm2 status"
   ```

2. **Check user ID is correct:**
   ```bash
   ssh pi "cat ~/apps/pet-trainer-bot/.env"
   ```
   - Get your ID from [@userinfobot](https://t.me/userinfobot)

3. **Check logs for errors:**
   ```bash
   ssh pi "pm2 logs pet-trainer-bot --lines 50"
   ```

### Can't Connect to Pi

1. **Find Pi's IP:**
   ```bash
   # Scan network
   arp -a | grep -i "b8:27:eb\|dc:a6:32\|e4:5f:01"
   ```

2. **Use IP instead of hostname:**
   ```bash
   ssh pi@192.168.1.XXX
   ```

3. **Check Pi is on:**
   ```bash
   ping raspberrypi.local
   ```

### Database Issues

**Database locked:**
```bash
ssh pi "pm2 restart pet-trainer-bot"
```

**Check database:**
```bash
ssh pi "sqlite3 ~/apps/pet-trainer-bot/training.db 'SELECT COUNT(*) FROM trainings;'"
```

---

## What Happens After Reboot?

**Good news:** PM2 automatically starts your bot when the Pi reboots! ✅

The `setup-pi.sh` script configured this for you.

**To verify:**
```bash
ssh pi "pm2 status"
```

---

## Next Steps

Now that your bot is running:

1. **Set up automated backups:**
   ```bash
   # On your Mac - edit crontab
   crontab -e
   
   # Add this line (daily backup at 2 AM)
   0 2 * * * /Users/yourusername/Documents/Perso/PetTrainerNotificationBot/scripts/sync-pi-db.sh backup
   ```

2. **Set up useful aliases:**
   ```bash
   # Add to ~/.zshrc or ~/.bashrc
   echo "alias pi-logs='ssh pi \"pm2 logs pet-trainer-bot\"'" >> ~/.zshrc
   echo "alias pi-status='ssh pi \"pm2 status\"'" >> ~/.zshrc
   echo "alias pi-restart='ssh pi \"pm2 restart pet-trainer-bot\"'" >> ~/.zshrc
   source ~/.zshrc
   ```

3. **Read the full guides:**
   - [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - Complete deployment guide
   - [PM2_COMMANDS.md](PM2_COMMANDS.md) - All PM2 commands
   - [REMOTE_DB_ACCESS.md](REMOTE_DB_ACCESS.md) - Database access options

---

## Quick Reference Card

| Task | Command |
|------|---------|
| SSH to Pi | `ssh pi` |
| Check status | `ssh pi "pm2 status"` |
| View logs | `ssh pi "pm2 logs pet-trainer-bot"` |
| Restart bot | `ssh pi "pm2 restart pet-trainer-bot"` |
| Pull database | `./scripts/sync-pi-db.sh pull` |
| Backup database | `./scripts/sync-pi-db.sh backup` |
| Check DB status | `./scripts/sync-pi-db.sh status` |
| Update bot | `ssh pi "cd ~/apps/pet-trainer-bot && git pull && npm install && npm run build && pm2 restart pet-trainer-bot"` |

---

## Support

**Need help?**

1. Check logs: `ssh pi "pm2 logs pet-trainer-bot --err"`
2. Review [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
3. Check [Troubleshooting](#troubleshooting) section above

---

## Summary

✅ **You've successfully deployed your bot to Raspberry Pi 5!**

Your bot is now:
- Running 24/7 on your Pi
- Automatically restarting if it crashes
- Starting automatically when Pi reboots
- Accessible remotely from your Mac

**Enjoy your automated pet training! 🐾**

