# Deployment Guide - Raspberry Pi 5 with PM2

Complete guide to deploy and manage the Pet Training Bot on your Raspberry Pi 5.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup on Raspberry Pi](#initial-setup-on-raspberry-pi)
3. [Deploying the Bot](#deploying-the-bot)
4. [Managing with PM2](#managing-with-pm2)
5. [Remote Database Access from Mac](#remote-database-access-from-mac)
6. [Monitoring and Maintenance](#monitoring-and-maintenance)
7. [Troubleshooting](#troubleshooting)
8. [Updating the Bot](#updating-the-bot)

---

## Prerequisites

### On Raspberry Pi 5

- Raspberry Pi OS (64-bit recommended)
- Network connection (WiFi or Ethernet)
- SSH enabled
- At least 1GB free storage

### On Your Mac

- SSH access to the Pi
- Git (for cloning the repository)
- SQLite3 (optional, for local database viewing)

---

## Initial Setup on Raspberry Pi

### 1. Enable SSH on Pi

If SSH is not already enabled:

```bash
# On the Pi directly
sudo systemctl enable ssh
sudo systemctl start ssh

# Or use raspi-config
sudo raspi-config
# Navigate to: Interface Options → SSH → Enable
```

### 2. Set Up SSH Keys from Mac

```bash
# On your Mac - generate SSH key if you don't have one
ssh-keygen -t ed25519 -C "your_email@example.com"

# Copy key to Pi
ssh-copy-id pi@raspberrypi.local
# Or if using IP address:
ssh-copy-id pi@192.168.1.XXX

# Test connection
ssh pi@raspberrypi.local
```

### 3. Configure SSH Config on Mac (Optional but Recommended)

```bash
# On your Mac
nano ~/.ssh/config
```

Add this configuration:

```
Host pi
    HostName raspberrypi.local
    User pi
    Port 22
    IdentityFile ~/.ssh/id_ed25519
    ServerAliveInterval 60
    ServerAliveCountMax 3
```

Now you can simply use `ssh pi` to connect.

---

## Deploying the Bot

### Option A: Deploy from Mac (Recommended)

**Step 1: Clone repository on your Mac (if not already done)**

```bash
cd ~/Documents/Perso
git clone https://github.com/lbrulet/PetTrainerNotificationBot.git
cd PetTrainerNotificationBot
```

**Step 2: Make setup script executable**

```bash
chmod +x scripts/setup-pi.sh
chmod +x sync-pi-db.sh
```

**Step 3: Copy project to Pi**

```bash
# From your Mac, in the project directory
ssh pi "mkdir -p ~/apps"

# Copy entire project to Pi
rsync -avz --exclude 'node_modules' \
           --exclude 'build' \
           --exclude '.git' \
           --exclude 'training.db' \
           . pi:~/apps/pet-trainer-bot/
```

**Step 4: SSH into Pi and run setup**

```bash
ssh pi
cd ~/apps/pet-trainer-bot
chmod +x scripts/setup-pi.sh
./scripts/setup-pi.sh
```

**Step 5: Configure environment variables**

```bash
# On Pi
cd ~/apps/pet-trainer-bot
nano .env
```

Add your configuration:

```env
TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather
OWNER_TELEGRAM_ID=your_telegram_user_id
```

Save and exit (Ctrl+X, Y, Enter).

**Step 6: Start the bot**

```bash
# On Pi
pm2 start ecosystem.config.cjs
pm2 save
pm2 logs pet-trainer-bot
```

### Option B: Deploy Directly on Pi

**Step 1: SSH into Pi**

```bash
ssh pi@raspberrypi.local
```

**Step 2: Clone repository**

```bash
mkdir -p ~/apps
cd ~/apps
git clone https://github.com/lbrulet/PetTrainerNotificationBot.git pet-trainer-bot
cd pet-trainer-bot
```

**Step 3: Run setup script**

```bash
chmod +x scripts/setup-pi.sh
./scripts/setup-pi.sh
```

**Step 4: Configure and start** (same as Option A steps 5-6)

---

## Managing with PM2

### Starting the Bot

```bash
# Start with production settings
pm2 start ecosystem.config.cjs

# Start with test mode (accelerated timers)
pm2 start ecosystem.config.cjs --env test

# Save configuration to persist across reboots
pm2 save
```

### Monitoring

```bash
# View status
pm2 status

# View logs in real-time
pm2 logs pet-trainer-bot

# View last 100 lines
pm2 logs pet-trainer-bot --lines 100

# View only errors
pm2 logs pet-trainer-bot --err

# Interactive monitoring dashboard
pm2 monit
```

### Controlling the Bot

```bash
# Restart
pm2 restart pet-trainer-bot

# Stop
pm2 stop pet-trainer-bot

# Start (if stopped)
pm2 start pet-trainer-bot

# Delete from PM2
pm2 delete pet-trainer-bot
```

### Viewing Detailed Information

```bash
# Show detailed info
pm2 show pet-trainer-bot

# Show all processes
pm2 list
```

For more PM2 commands, see [PM2_COMMANDS.md](PM2_COMMANDS.md).

---

## Remote Database Access from Mac

### Quick Setup

**Step 1: Make sync script executable**

```bash
# On your Mac, in the project directory
chmod +x scripts/sync-pi-db.sh
```

**Step 2: Edit configuration (if needed)**

```bash
nano scripts/sync-pi-db.sh
```

Update these variables if your setup is different:

```bash
PI_HOST="pi"  # Your SSH host
PI_DB_PATH="~/apps/pet-trainer-bot/training.db"
LOCAL_DB_PATH="$HOME/Documents/Perso/PetTrainerNotificationBot/training.db"
```

### Using the Sync Script

```bash
# Pull database from Pi to Mac
./scripts/sync-pi-db.sh pull

# View database status
./scripts/sync-pi-db.sh status

# Create backup
./scripts/sync-pi-db.sh backup

# Push database to Pi (careful!)
./scripts/sync-pi-db.sh push

# Run SQL query on Pi database
./scripts/sync-pi-db.sh query "SELECT * FROM trainings WHERE is_active = 1;"

# Compare local and remote
./scripts/sync-pi-db.sh compare
```

### Direct Database Access

```bash
# Quick query via SSH
ssh pi "sqlite3 ~/apps/pet-trainer-bot/training.db 'SELECT * FROM trainings;'"

# Interactive SQLite session
ssh pi
cd ~/apps/pet-trainer-bot
sqlite3 training.db
```

For more database access options, see [REMOTE_DB_ACCESS.md](REMOTE_DB_ACCESS.md).

---

## Monitoring and Maintenance

### Daily Monitoring

```bash
# From your Mac - check bot status
ssh pi "pm2 status"

# View recent logs
ssh pi "pm2 logs pet-trainer-bot --lines 50"

# Check database status
./scripts/sync-pi-db.sh status
```

### Weekly Maintenance

```bash
# Create backup
./scripts/sync-pi-db.sh backup

# Check for updates
ssh pi "cd ~/apps/pet-trainer-bot && git fetch"

# Clear old logs
ssh pi "pm2 flush"
```

### Automated Backups

Set up automatic daily backups on your Mac:

```bash
# Edit crontab
crontab -e

# Add this line (runs daily at 2 AM)
0 2 * * * /Users/yourusername/Documents/Perso/PetTrainerNotificationBot/scripts/sync-pi-db.sh backup
```

### Log Rotation

PM2 log rotation is configured automatically by `setup-pi.sh`:

- Max log size: 10MB
- Retained logs: 7 days
- Compression: enabled

To adjust settings:

```bash
ssh pi "pm2 set pm2-logrotate:max_size 20M"
ssh pi "pm2 set pm2-logrotate:retain 14"
```

---

## Troubleshooting

### Bot Won't Start

**Check logs:**

```bash
ssh pi "pm2 logs pet-trainer-bot --err --lines 50"
```

**Common issues:**

1. **Missing .env file:**
   ```bash
   ssh pi "ls -la ~/apps/pet-trainer-bot/.env"
   ```

2. **Invalid environment variables:**
   ```bash
   ssh pi "cat ~/apps/pet-trainer-bot/.env"
   ```

3. **Build errors:**
   ```bash
   ssh pi "cd ~/apps/pet-trainer-bot && npm run build"
   ```

### Bot Keeps Restarting

**Check restart count:**

```bash
ssh pi "pm2 list"
```

If restart count is high:

```bash
# View error logs
ssh pi "pm2 logs pet-trainer-bot --err --lines 100"

# Common causes:
# - Database corruption
# - Invalid bot token
# - Network issues
```

### Database Issues

**Database locked:**

```bash
# Stop bot temporarily
ssh pi "pm2 stop pet-trainer-bot"

# Check for locks
ssh pi "lsof ~/apps/pet-trainer-bot/training.db"

# Restart bot
ssh pi "pm2 start pet-trainer-bot"
```

**Database corruption:**

```bash
# Create backup first
./scripts/sync-pi-db.sh backup

# Check integrity on Pi
ssh pi "sqlite3 ~/apps/pet-trainer-bot/training.db 'PRAGMA integrity_check;'"

# If corrupted, restore from backup
ssh pi "cp ~/apps/pet-trainer-bot/backups/training-YYYYMMDD-HHMMSS.db ~/apps/pet-trainer-bot/training.db"
ssh pi "pm2 restart pet-trainer-bot"
```

### Cannot Connect to Pi

**Check if Pi is online:**

```bash
ping raspberrypi.local
# or
ping 192.168.1.XXX
```

**Find Pi's IP address:**

```bash
# If you have physical access to Pi
hostname -I

# Or scan your network from Mac
arp -a | grep -i "b8:27:eb\|dc:a6:32\|e4:5f:01"  # Raspberry Pi MAC prefixes
```

**SSH not responding:**

```bash
# Check SSH service on Pi (requires physical access or monitor)
sudo systemctl status ssh
sudo systemctl restart ssh
```

### High Memory Usage

```bash
# Check memory
ssh pi "pm2 monit"

# Restart to clear memory
ssh pi "pm2 restart pet-trainer-bot"

# Adjust max memory restart in ecosystem.config.cjs
# max_memory_restart: '200M'
```

---

## Updating the Bot

### Method 1: Git Pull (Recommended)

```bash
# On Pi
ssh pi
cd ~/apps/pet-trainer-bot

# Backup database first
cp training.db backups/training-$(date +%Y%m%d-%H%M%S).db

# Pull latest changes
git pull

# Install dependencies
npm install

# Rebuild
npm run build

# Restart bot
pm2 restart pet-trainer-bot

# Check logs
pm2 logs pet-trainer-bot
```

### Method 2: Full Redeploy from Mac

```bash
# On your Mac
cd ~/Documents/Perso/PetTrainerNotificationBot

# Pull latest changes
git pull

# Backup Pi database first
./scripts/sync-pi-db.sh backup

# Sync to Pi (excluding database)
rsync -avz --exclude 'node_modules' \
           --exclude 'build' \
           --exclude '.git' \
           --exclude 'training.db' \
           --exclude 'training.db-*' \
           . pi:~/apps/pet-trainer-bot/

# SSH to Pi and rebuild
ssh pi "cd ~/apps/pet-trainer-bot && npm install && npm run build && pm2 restart pet-trainer-bot"
```

### Method 3: Automated Update Script

Create `update-bot.sh` on Pi:

```bash
#!/bin/bash
cd ~/apps/pet-trainer-bot
echo "📦 Updating Pet Training Bot..."

# Backup database
cp training.db backups/training-$(date +%Y%m%d-%H%M%S).db

# Pull changes
git pull

# Install and build
npm install
npm run build

# Restart
pm2 restart pet-trainer-bot

echo "✅ Update complete!"
pm2 logs pet-trainer-bot --lines 20
```

Make it executable:

```bash
chmod +x ~/apps/pet-trainer-bot/update-bot.sh
```

Run from Mac:

```bash
ssh pi "~/apps/pet-trainer-bot/update-bot.sh"
```

---

## Performance Tips

### Optimize Pi Performance

```bash
# Check Pi temperature
ssh pi "vcgencmd measure_temp"

# Check memory usage
ssh pi "free -h"

# Check disk space
ssh pi "df -h"
```

### Reduce Memory Usage

In `ecosystem.config.cjs`:

```javascript
max_memory_restart: '150M',  // Restart if exceeds 150MB
```

### Monitor Network

```bash
# Check network latency
ping raspberrypi.local

# Monitor bandwidth (if needed)
ssh pi "sudo apt install nethogs && sudo nethogs"
```

---

## Security Best Practices

1. **Use SSH keys** (not passwords)
2. **Keep system updated:**
   ```bash
   ssh pi "sudo apt update && sudo apt upgrade -y"
   ```
3. **Firewall configuration:**
   ```bash
   ssh pi "sudo apt install ufw"
   ssh pi "sudo ufw allow ssh"
   ssh pi "sudo ufw enable"
   ```
4. **Regular backups:**
   ```bash
   ./scripts/sync-pi-db.sh backup
   ```
5. **Monitor logs for suspicious activity:**
   ```bash
   ssh pi "pm2 logs pet-trainer-bot | grep -i 'unauthorized\|error\|fail'"
   ```

---

## Quick Reference

### Essential Commands

```bash
# Start bot
ssh pi "pm2 start ~/apps/pet-trainer-bot/ecosystem.config.cjs"

# Restart bot
ssh pi "pm2 restart pet-trainer-bot"

# View logs
ssh pi "pm2 logs pet-trainer-bot"

# Check status
ssh pi "pm2 status"

# Pull database
./scripts/sync-pi-db.sh pull

# Backup database
./scripts/sync-pi-db.sh backup

# Update bot
ssh pi "cd ~/apps/pet-trainer-bot && git pull && npm install && npm run build && pm2 restart pet-trainer-bot"
```

### Useful Aliases for Mac

Add to `~/.zshrc` or `~/.bashrc`:

```bash
alias pi-ssh='ssh pi'
alias pi-logs='ssh pi "pm2 logs pet-trainer-bot"'
alias pi-status='ssh pi "pm2 status"'
alias pi-restart='ssh pi "pm2 restart pet-trainer-bot"'
alias pi-db-pull='cd ~/Documents/Perso/PetTrainerNotificationBot && ./scripts/sync-pi-db.sh pull'
alias pi-db-status='cd ~/Documents/Perso/PetTrainerNotificationBot && ./scripts/sync-pi-db.sh status'
```

Reload shell:

```bash
source ~/.zshrc  # or source ~/.bashrc
```

---

## Support

If you encounter issues:

1. Check logs: `ssh pi "pm2 logs pet-trainer-bot --err"`
2. Review this guide's troubleshooting section
3. Check [PM2_COMMANDS.md](PM2_COMMANDS.md) for PM2-specific issues
4. Check [REMOTE_DB_ACCESS.md](REMOTE_DB_ACCESS.md) for database issues

---

## Summary

✅ **Setup:** Run `setup-pi.sh` on Pi  
✅ **Deploy:** Copy files and start with PM2  
✅ **Monitor:** Use `pm2 logs` and `pm2 status`  
✅ **Database:** Use `sync-pi-db.sh` from Mac  
✅ **Update:** Git pull, rebuild, restart  
✅ **Backup:** Regular automated backups  

Your bot is now running 24/7 on your Raspberry Pi 5! 🚀

