# PM2 Setup Summary for Raspberry Pi 5

## What You Got

Your Pet Training Bot is now ready to deploy on Raspberry Pi 5 with complete remote management from your Mac! 🚀

## Files Created

### Configuration Files

1. **`ecosystem.config.cjs`** - PM2 configuration
   - Defines how PM2 runs your bot
   - Includes auto-restart, memory limits, and logging settings
   - Supports both production and test modes

### Scripts

2. **`setup-pi.sh`** - Automated setup script for Pi
   - Installs Node.js, PM2, and SQLite3
   - Sets up log rotation
   - Configures PM2 to start on boot
   - Builds your project

3. **`sync-pi-db.sh`** - Database sync tool for Mac
   - Pull database from Pi to Mac
   - Push database from Mac to Pi (with safety checks)
   - Create backups
   - Compare databases
   - Run queries remotely

### Documentation

4. **`PI_QUICKSTART.md`** - 10-minute quick start guide
   - Step-by-step setup instructions
   - Essential commands
   - Troubleshooting tips

5. **`DEPLOYMENT_GUIDE.md`** - Complete deployment guide
   - Detailed setup instructions
   - Multiple deployment methods
   - Monitoring and maintenance
   - Security best practices
   - Update procedures

6. **`PM2_COMMANDS.md`** - PM2 command reference
   - All PM2 commands you'll need
   - Troubleshooting commands
   - Remote management commands
   - Useful one-liners

7. **`REMOTE_DB_ACCESS.md`** - Database access guide
   - SSH tunnel setup
   - SSHFS mounting
   - GUI tool configuration
   - Security best practices

8. **`.env.example`** - Environment variables template
   - Template for configuration

9. **Updated `README.md`** - Added PM2 deployment section

---

## Quick Start

### 1. Deploy to Pi (5 minutes)

```bash
# On your Mac
cd ~/Documents/Perso/PetTrainerNotificationBot

# Copy to Pi
rsync -avz --exclude 'node_modules' --exclude 'build' --exclude '.git' . pi:~/apps/pet-trainer-bot/

# Run setup on Pi
ssh pi "cd ~/apps/pet-trainer-bot && chmod +x scripts/setup-pi.sh && ./scripts/setup-pi.sh"
```

### 2. Configure (1 minute)

```bash
# Create .env file on Pi
ssh pi "cd ~/apps/pet-trainer-bot && nano .env"
```

Add:
```env
TELEGRAM_BOT_TOKEN=your_token
OWNER_TELEGRAM_ID=your_id
```

### 3. Start (1 minute)

```bash
# Start bot with PM2
ssh pi "cd ~/apps/pet-trainer-bot && pm2 start ecosystem.config.cjs && pm2 save"

# View logs
ssh pi "pm2 logs pet-trainer-bot"
```

### 4. Test

Send `/start` to your bot on Telegram!

---

## Essential Commands

### From Your Mac

```bash
# Check status
ssh pi "pm2 status"

# View logs
ssh pi "pm2 logs pet-trainer-bot"

# Restart bot
ssh pi "pm2 restart pet-trainer-bot"

# Pull database
./scripts/sync-pi-db.sh pull

# Check database
./scripts/sync-pi-db.sh status

# Backup database
./scripts/sync-pi-db.sh backup
```

---

## Features

### Bot Management
- ✅ Automatic restart on crash
- ✅ Starts on Pi reboot
- ✅ Memory monitoring and auto-restart
- ✅ Log rotation (10MB max, 7 days retention)
- ✅ Remote monitoring from Mac

### Database Access
- ✅ Pull database to Mac
- ✅ Push database to Pi (with backups)
- ✅ Remote queries via SSH
- ✅ Automatic backups
- ✅ Database comparison
- ✅ SSHFS mounting option
- ✅ GUI tool support (TablePlus, DB Browser)

### Monitoring
- ✅ Real-time logs
- ✅ Status monitoring
- ✅ Performance metrics
- ✅ Error tracking
- ✅ Remote access from Mac

---

## File Structure

```
PetTrainerNotificationBot/
├── ecosystem.config.cjs          # PM2 configuration
├── setup-pi.sh                   # Pi setup script
├── sync-pi-db.sh                 # Database sync script (Mac)
├── .env.example                  # Environment template
│
├── PI_QUICKSTART.md              # Quick start guide
├── DEPLOYMENT_GUIDE.md           # Complete deployment guide
├── PM2_COMMANDS.md               # PM2 command reference
├── REMOTE_DB_ACCESS.md           # Database access guide
│
├── src/                          # Source code
├── build/                        # Compiled code (created by npm run build)
├── logs/                         # PM2 logs (created on Pi)
├── backups/                      # Database backups
└── training.db                   # SQLite database
```

---

## Architecture

```
┌─────────────────┐
│   Your Mac      │
│                 │
│  ┌───────────┐  │
│  │ Terminal  │  │ ──── SSH ───┐
│  └───────────┘  │             │
│                 │             │
│  ┌───────────┐  │             │
│  │sync-pi-db │  │ ──── SCP ───┤
│  └───────────┘  │             │
│                 │             │
│  ┌───────────┐  │             │
│  │ SQLite    │  │ ◄─── Pull ──┤
│  │ Client    │  │             │
│  └───────────┘  │             │
└─────────────────┘             │
                                │
                                ▼
                    ┌─────────────────────┐
                    │  Raspberry Pi 5     │
                    │                     │
                    │  ┌──────────────┐   │
                    │  │     PM2      │   │
                    │  │              │   │
                    │  │  ┌────────┐  │   │
                    │  │  │  Bot   │  │   │
                    │  │  │Process │  │   │
                    │  │  └────┬───┘  │   │
                    │  └───────┼──────┘   │
                    │          │          │
                    │  ┌───────▼──────┐   │
                    │  │  training.db │   │
                    │  └──────────────┘   │
                    │          │          │
                    └──────────┼──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │  Telegram Servers   │
                    └─────────────────────┘
```

---

## What Happens When...

### Pi Reboots
✅ PM2 automatically starts your bot  
✅ No manual intervention needed

### Bot Crashes
✅ PM2 automatically restarts it  
✅ Logs the error for debugging  
✅ Gives up after 10 restarts in 1 minute (prevents infinite loops)

### Memory Gets High
✅ PM2 restarts bot when it exceeds 200MB  
✅ Prevents memory leaks from crashing the Pi

### Logs Get Large
✅ Automatic rotation at 10MB  
✅ Keeps last 7 rotated logs  
✅ Compresses old logs

---

## Customization

### Change Memory Limit

Edit `ecosystem.config.cjs`:
```javascript
max_memory_restart: '150M',  // Change from 200M
```

### Change Log Retention

```bash
ssh pi "pm2 set pm2-logrotate:retain 14"  # Keep 14 days instead of 7
```

### Enable Test Mode

```bash
ssh pi "pm2 restart pet-trainer-bot --env test"
```

### Change Restart Behavior

Edit `ecosystem.config.cjs`:
```javascript
max_restarts: 5,        // Max restarts (default: 10)
restart_delay: 2000,    // Wait 2 seconds between restarts (default: 4000)
```

---

## Monitoring

### Real-time Dashboard

```bash
ssh pi "pm2 monit"
```

Shows:
- CPU usage
- Memory usage
- Logs in real-time
- Process status

### View Logs

```bash
# All logs
ssh pi "pm2 logs pet-trainer-bot"

# Only errors
ssh pi "pm2 logs pet-trainer-bot --err"

# Last 100 lines
ssh pi "pm2 logs pet-trainer-bot --lines 100"
```

### Check Status

```bash
ssh pi "pm2 status"
```

Shows:
- Uptime
- Restart count
- Memory usage
- CPU usage

---

## Backup Strategy

### Automated Daily Backups

Add to your Mac's crontab:

```bash
crontab -e
```

Add:
```
0 2 * * * /Users/yourusername/Documents/Perso/PetTrainerNotificationBot/scripts/sync-pi-db.sh backup
```

This creates a backup every day at 2 AM.

### Manual Backups

```bash
# Quick backup
./scripts/sync-pi-db.sh backup

# Or pull to local
./scripts/sync-pi-db.sh pull
```

---

## Updating the Bot

### Quick Update

```bash
# From your Mac
ssh pi "cd ~/apps/pet-trainer-bot && git pull && npm install && npm run build && pm2 restart pet-trainer-bot"
```

### Full Redeploy

```bash
# Backup first
./scripts/sync-pi-db.sh backup

# Sync new code
rsync -avz --exclude 'node_modules' --exclude 'build' --exclude '.git' --exclude 'training.db*' . pi:~/apps/pet-trainer-bot/

# Rebuild and restart
ssh pi "cd ~/apps/pet-trainer-bot && npm install && npm run build && pm2 restart pet-trainer-bot"
```

---

## Troubleshooting

### Bot Won't Start

```bash
# Check logs
ssh pi "pm2 logs pet-trainer-bot --err --lines 50"

# Common fixes:
ssh pi "cd ~/apps/pet-trainer-bot && npm run build && pm2 restart pet-trainer-bot"
```

### High Restart Count

```bash
# Check what's causing restarts
ssh pi "pm2 logs pet-trainer-bot --err"

# Reset counter
ssh pi "pm2 reset pet-trainer-bot"
```

### Database Locked

```bash
# Restart bot
ssh pi "pm2 restart pet-trainer-bot"
```

### Can't Connect to Pi

```bash
# Find Pi's IP
arp -a | grep -i "b8:27:eb\|dc:a6:32\|e4:5f:01"

# Use IP instead
ssh pi@192.168.1.XXX
```

---

## Security Notes

1. **SSH Keys**: Setup script assumes you're using SSH keys (recommended)
2. **Firewall**: Consider enabling UFW on Pi
3. **Updates**: Keep Pi OS and packages updated
4. **Backups**: Regular automated backups protect your data
5. **Database Access**: Only accessible via SSH (secure by default)

---

## Performance

### Expected Resource Usage

- **Memory**: 50-100MB (restarts at 200MB)
- **CPU**: <1% when idle, 2-5% when active
- **Disk**: ~100MB for code, logs rotate automatically
- **Network**: Minimal (only Telegram API calls)

### Optimization Tips

1. **Memory**: Restart weekly to clear any leaks
2. **Logs**: Already optimized with rotation
3. **Database**: Vacuum occasionally:
   ```bash
   ssh pi "sqlite3 ~/apps/pet-trainer-bot/training.db 'VACUUM;'"
   ```

---

## Next Steps

1. ✅ **Deploy**: Follow [PI_QUICKSTART.md](PI_QUICKSTART.md)
2. ✅ **Test**: Send `/start` to your bot
3. ✅ **Monitor**: Check logs and status
4. ✅ **Backup**: Set up automated backups
5. ✅ **Customize**: Adjust settings as needed

---

## Support

**Documentation:**
- [PI_QUICKSTART.md](PI_QUICKSTART.md) - Quick start
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - Full guide
- [PM2_COMMANDS.md](PM2_COMMANDS.md) - Command reference
- [REMOTE_DB_ACCESS.md](REMOTE_DB_ACCESS.md) - Database access

**Need Help?**
1. Check logs: `ssh pi "pm2 logs pet-trainer-bot --err"`
2. Review troubleshooting sections in guides
3. Check PM2 status: `ssh pi "pm2 status"`

---

## Summary

You now have:
- ✅ Complete PM2 setup for Raspberry Pi 5
- ✅ Automated deployment scripts
- ✅ Remote database access from Mac
- ✅ Comprehensive documentation
- ✅ Monitoring and maintenance tools
- ✅ Backup and recovery procedures

**Your bot is ready for 24/7 operation! 🚀**

