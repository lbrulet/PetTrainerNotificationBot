# Deployment Checklist - Raspberry Pi 5

Use this checklist to ensure a smooth deployment of your Pet Training Bot.

---

## Pre-Deployment

### Prerequisites
- [ ] Raspberry Pi 5 with Raspberry Pi OS installed
- [ ] Pi connected to network (WiFi or Ethernet)
- [ ] SSH enabled on Pi
- [ ] Mac and Pi on same network
- [ ] Telegram bot token obtained from [@BotFather](https://t.me/botfather)
- [ ] Telegram user ID obtained from [@userinfobot](https://t.me/userinfobot)

### Mac Setup
- [ ] SSH keys generated (`ssh-keygen`)
- [ ] SSH key copied to Pi (`ssh-copy-id pi@raspberrypi.local`)
- [ ] Can connect to Pi without password (`ssh pi`)
- [ ] Project cloned/downloaded to Mac
- [ ] Scripts made executable (`chmod +x scripts/setup-pi.sh sync-pi-db.sh`)

---

## Deployment Steps

### 1. Copy Project to Pi
- [ ] Created apps directory on Pi: `ssh pi "mkdir -p ~/apps"`
- [ ] Synced project files to Pi:
  ```bash
  rsync -avz --exclude 'node_modules' --exclude 'build' --exclude '.git' --exclude 'training.db' . pi:~/apps/pet-trainer-bot/
  ```
- [ ] Verified files copied: `ssh pi "ls -la ~/apps/pet-trainer-bot"`

### 2. Run Setup Script
- [ ] Made script executable: `ssh pi "chmod +x ~/apps/pet-trainer-bot/setup-pi.sh"`
- [ ] Ran setup script: `ssh pi "cd ~/apps/pet-trainer-bot && ./scripts/setup-pi.sh"`
- [ ] Setup completed without errors
- [ ] Node.js installed: `ssh pi "node --version"`
- [ ] PM2 installed: `ssh pi "pm2 --version"`
- [ ] SQLite3 installed: `ssh pi "sqlite3 --version"`
- [ ] Project built successfully (check for `build/` directory)

### 3. Configure Environment
- [ ] Created `.env` file: `ssh pi "nano ~/apps/pet-trainer-bot/.env"`
- [ ] Added `TELEGRAM_BOT_TOKEN`
- [ ] Added `OWNER_TELEGRAM_ID`
- [ ] Saved and closed file
- [ ] Verified .env file: `ssh pi "cat ~/apps/pet-trainer-bot/.env"`

### 4. Start Bot with PM2
- [ ] Started bot: `ssh pi "cd ~/apps/pet-trainer-bot && pm2 start ecosystem.config.cjs"`
- [ ] Bot status shows "online": `ssh pi "pm2 status"`
- [ ] Saved PM2 config: `ssh pi "pm2 save"`
- [ ] Configured startup script: `ssh pi "pm2 startup"` (run the command it outputs)
- [ ] Verified logs show bot started: `ssh pi "pm2 logs pet-trainer-bot --lines 20"`

### 5. Test Bot
- [ ] Opened Telegram and found bot
- [ ] Sent `/start` command
- [ ] Received welcome message with command list
- [ ] Sent `/status` command
- [ ] Received status response
- [ ] Tested `/rental_c` command
- [ ] Tested `/train_c` command
- [ ] Received training started confirmation

---

## Post-Deployment

### Verify Operation
- [ ] Bot responds to commands
- [ ] Database created: `ssh pi "ls -la ~/apps/pet-trainer-bot/training.db"`
- [ ] Logs directory created: `ssh pi "ls -la ~/apps/pet-trainer-bot/logs"`
- [ ] No errors in logs: `ssh pi "pm2 logs pet-trainer-bot --err --lines 50"`
- [ ] Bot shows correct uptime: `ssh pi "pm2 status"`

### Configure Remote Access
- [ ] Edited `sync-pi-db.sh` with correct `PI_HOST` if needed
- [ ] Tested database pull: `./scripts/sync-pi-db.sh pull`
- [ ] Tested database status: `./scripts/sync-pi-db.sh status`
- [ ] Created backup: `./scripts/sync-pi-db.sh backup`
- [ ] Verified backup in `backups/` directory

### Set Up Monitoring
- [ ] Can check status from Mac: `ssh pi "pm2 status"`
- [ ] Can view logs from Mac: `ssh pi "pm2 logs pet-trainer-bot"`
- [ ] Can restart from Mac: `ssh pi "pm2 restart pet-trainer-bot"`
- [ ] Tested interactive monitoring: `ssh pi "pm2 monit"` (press Ctrl+C to exit)

### Configure Backups
- [ ] Tested manual backup: `./scripts/sync-pi-db.sh backup`
- [ ] Set up automated backups (optional):
  ```bash
  crontab -e
  # Add: 0 2 * * * /path/to/scripts/sync-pi-db.sh backup
  ```
- [ ] Verified backup location: `ls -la backups/`

### Test Reboot Persistence
- [ ] Rebooted Pi: `ssh pi "sudo reboot"`
- [ ] Waited 2 minutes for Pi to restart
- [ ] Reconnected: `ssh pi`
- [ ] Verified bot auto-started: `ssh pi "pm2 status"`
- [ ] Checked bot is responding in Telegram

---

## Optional Enhancements

### SSH Configuration
- [ ] Created SSH config file: `nano ~/.ssh/config`
- [ ] Added Pi host configuration
- [ ] Can connect with: `ssh pi`

### Useful Aliases
- [ ] Added aliases to `~/.zshrc` or `~/.bashrc`:
  ```bash
  alias pi-ssh='ssh pi'
  alias pi-logs='ssh pi "pm2 logs pet-trainer-bot"'
  alias pi-status='ssh pi "pm2 status"'
  alias pi-restart='ssh pi "pm2 restart pet-trainer-bot"'
  ```
- [ ] Reloaded shell: `source ~/.zshrc`

### Database GUI Access
- [ ] Installed TablePlus or DB Browser for SQLite
- [ ] Configured SSH tunnel in GUI tool
- [ ] Successfully connected to Pi database
- [ ] Can view trainings table

### Security Hardening
- [ ] Changed default Pi password: `ssh pi "passwd"`
- [ ] Disabled password authentication (SSH keys only)
- [ ] Installed and configured UFW firewall (optional)
- [ ] Set up fail2ban (optional)

---

## Troubleshooting Checklist

If something goes wrong, check these:

### Bot Won't Start
- [ ] Checked error logs: `ssh pi "pm2 logs pet-trainer-bot --err"`
- [ ] Verified .env file exists and is correct
- [ ] Verified bot token is valid
- [ ] Verified user ID is correct
- [ ] Tried rebuilding: `ssh pi "cd ~/apps/pet-trainer-bot && npm run build"`
- [ ] Tried restarting: `ssh pi "pm2 restart pet-trainer-bot"`

### Bot Not Responding
- [ ] Verified bot is running: `ssh pi "pm2 status"`
- [ ] Checked logs for errors: `ssh pi "pm2 logs pet-trainer-bot"`
- [ ] Verified correct user ID in .env
- [ ] Tested with `/start` command
- [ ] Checked Pi has internet connection: `ssh pi "ping -c 3 google.com"`

### Can't Connect to Pi
- [ ] Verified Pi is powered on
- [ ] Pinged Pi: `ping raspberrypi.local`
- [ ] Tried IP address instead of hostname
- [ ] Checked Pi is on same network
- [ ] Verified SSH is enabled on Pi

### Database Issues
- [ ] Checked database exists: `ssh pi "ls -la ~/apps/pet-trainer-bot/training.db"`
- [ ] Checked database permissions: `ssh pi "ls -la ~/apps/pet-trainer-bot/training.db"`
- [ ] Tested database integrity: `ssh pi "sqlite3 ~/apps/pet-trainer-bot/training.db 'PRAGMA integrity_check;'"`
- [ ] Tried restarting bot: `ssh pi "pm2 restart pet-trainer-bot"`

---

## Maintenance Schedule

### Daily
- [ ] Check bot status: `ssh pi "pm2 status"`
- [ ] Quick log check: `ssh pi "pm2 logs pet-trainer-bot --lines 10"`

### Weekly
- [ ] Review full logs: `ssh pi "pm2 logs pet-trainer-bot --lines 100"`
- [ ] Create manual backup: `./scripts/sync-pi-db.sh backup`
- [ ] Check disk space: `ssh pi "df -h"`
- [ ] Check memory usage: `ssh pi "free -h"`

### Monthly
- [ ] Update Pi OS: `ssh pi "sudo apt update && sudo apt upgrade -y"`
- [ ] Update PM2: `ssh pi "sudo npm update -g pm2"`
- [ ] Review and clean old backups
- [ ] Vacuum database: `ssh pi "sqlite3 ~/apps/pet-trainer-bot/training.db 'VACUUM;'"`
- [ ] Restart bot for fresh start: `ssh pi "pm2 restart pet-trainer-bot"`

---

## Success Criteria

Your deployment is successful when:

- ✅ Bot responds to all commands in Telegram
- ✅ PM2 shows bot status as "online"
- ✅ No errors in logs
- ✅ Bot survives Pi reboot
- ✅ Can access database from Mac
- ✅ Backups are working
- ✅ Can monitor and control bot remotely

---

## Quick Reference

### Essential Commands

```bash
# Check status
ssh pi "pm2 status"

# View logs
ssh pi "pm2 logs pet-trainer-bot"

# Restart bot
ssh pi "pm2 restart pet-trainer-bot"

# Pull database
./scripts/sync-pi-db.sh pull

# Backup database
./scripts/sync-pi-db.sh backup

# Update bot
ssh pi "cd ~/apps/pet-trainer-bot && git pull && npm install && npm run build && pm2 restart pet-trainer-bot"
```

---

## Documentation Reference

- **Quick Start**: [PI_QUICKSTART.md](PI_QUICKSTART.md)
- **Full Guide**: [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
- **PM2 Commands**: [PM2_COMMANDS.md](PM2_COMMANDS.md)
- **Database Access**: [REMOTE_DB_ACCESS.md](REMOTE_DB_ACCESS.md)
- **Setup Summary**: [PM2_SETUP_SUMMARY.md](PM2_SETUP_SUMMARY.md)

---

## Notes

**Date Deployed**: _______________

**Pi Hostname/IP**: _______________

**Bot Username**: @_______________

**Issues Encountered**: 

_______________________________________________

_______________________________________________

_______________________________________________

**Resolution**: 

_______________________________________________

_______________________________________________

_______________________________________________

---

## Completion

- [ ] All deployment steps completed
- [ ] All tests passed
- [ ] Bot running successfully
- [ ] Remote access configured
- [ ] Backups configured
- [ ] Documentation reviewed

**Deployment Status**: ⬜ In Progress  ⬜ Complete  ⬜ Issues

**Deployed By**: _______________

**Date**: _______________

---

🎉 **Congratulations! Your Pet Training Bot is now running 24/7 on Raspberry Pi 5!**

