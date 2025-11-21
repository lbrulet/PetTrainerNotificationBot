# 🚀 Start Here - PM2 Deployment for Raspberry Pi 5

Welcome! This guide will help you deploy your Pet Training Bot to run 24/7 on your Raspberry Pi 5 with full remote management from your Mac.

---

## 📋 What You Need

- **Raspberry Pi 5** with Raspberry Pi OS
- **Mac** (for development and remote management)
- **Network** connection for both devices
- **Telegram bot token** from [@BotFather](https://t.me/botfather)
- **Your Telegram user ID** from [@userinfobot](https://t.me/userinfobot)

**Time Required**: 10-15 minutes

---

## 🎯 Choose Your Path

### 🏃 Quick Start (Recommended for First-Time Users)

**Want to get up and running fast?**

👉 **Follow: [PI_QUICKSTART.md](PI_QUICKSTART.md)**

This guide will have your bot running in under 10 minutes with step-by-step instructions.

---

### 📚 Complete Guide (Recommended for Detailed Setup)

**Want to understand every step?**

👉 **Follow: [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)**

Comprehensive guide covering:
- Multiple deployment methods
- Security best practices
- Monitoring and maintenance
- Troubleshooting
- Update procedures

---

### ✅ Checklist Approach (Recommended for Experienced Users)

**Already familiar with Linux/Pi deployment?**

👉 **Follow: [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)**

A checklist-style guide you can follow step-by-step and mark off as you go.

---

## 📖 Documentation Overview

### Setup & Deployment

| Document | Purpose | When to Use |
|----------|---------|-------------|
| **[PI_QUICKSTART.md](PI_QUICKSTART.md)** | Get started in 10 minutes | First-time setup |
| **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** | Complete deployment guide | Detailed setup |
| **[DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)** | Step-by-step checklist | Systematic deployment |

### Reference & Management

| Document | Purpose | When to Use |
|----------|---------|-------------|
| **[PM2_COMMANDS.md](PM2_COMMANDS.md)** | PM2 command reference | Managing the bot |
| **[REMOTE_DB_ACCESS.md](REMOTE_DB_ACCESS.md)** | Database access guide | Accessing data from Mac |
| **[PM2_SETUP_SUMMARY.md](PM2_SETUP_SUMMARY.md)** | Overview of setup | Understanding the system |

### General

| Document | Purpose | When to Use |
|----------|---------|-------------|
| **[README.md](README.md)** | Project overview | Understanding the bot |
| **[QUICKSTART.md](QUICKSTART.md)** | Local development | Testing locally |

---

## 🛠️ Key Files

### Configuration Files

- **`ecosystem.config.cjs`** - PM2 configuration for production deployment
- **`.env`** - Environment variables (you'll create this)

### Scripts

- **`scripts/setup-pi.sh`** - Automated setup script for Raspberry Pi
- **`scripts/sync-pi-db.sh`** - Database sync tool for Mac ↔️ Pi

### Source Code

- **`src/`** - TypeScript source code
- **`build/`** - Compiled JavaScript (created by build process)

---

## 🎬 Quick Start Summary

Here's the 30-second version:

```bash
# 1. Copy project to Pi
rsync -avz --exclude 'node_modules' --exclude 'build' --exclude '.git' . pi:~/apps/pet-trainer-bot/

# 2. Run setup on Pi
ssh pi "cd ~/apps/pet-trainer-bot && chmod +x scripts/setup-pi.sh && ./scripts/setup-pi.sh"

# 3. Configure environment
ssh pi "nano ~/apps/pet-trainer-bot/.env"
# Add: TELEGRAM_BOT_TOKEN=... and OWNER_TELEGRAM_ID=...

# 4. Start bot
ssh pi "cd ~/apps/pet-trainer-bot && pm2 start ecosystem.config.cjs && pm2 save"

# 5. Test in Telegram
# Send /start to your bot
```

**That's it!** Your bot is now running 24/7.

---

## 🔧 What Gets Set Up

### On Raspberry Pi

✅ **Node.js** - Runtime environment  
✅ **PM2** - Process manager for 24/7 operation  
✅ **SQLite3** - Database engine  
✅ **Your Bot** - Built and running  
✅ **Auto-start** - Bot starts on Pi reboot  
✅ **Log rotation** - Automatic log management  

### On Your Mac

✅ **Database sync tool** - Pull/push database  
✅ **Remote management** - Control bot via SSH  
✅ **Backup system** - Automated database backups  

---

## 🎯 Key Features

### Bot Management
- 🔄 **Auto-restart** on crash
- 🚀 **Auto-start** on Pi reboot
- 📊 **Memory monitoring** with auto-restart
- 📝 **Log rotation** (10MB max, 7 days retention)
- 🖥️ **Remote monitoring** from Mac

### Database Access
- 📥 **Pull** database to Mac
- 📤 **Push** database to Pi (with safety checks)
- 🔍 **Query** remotely via SSH
- 💾 **Automated backups**
- 🔄 **Sync** between Mac and Pi
- 🗄️ **GUI tools** support (TablePlus, DB Browser)

### Monitoring
- 📊 Real-time logs
- ✅ Status monitoring
- 📈 Performance metrics
- 🚨 Error tracking
- 🌐 Remote access from Mac

---

## 💡 Common Tasks

### Check Bot Status
```bash
ssh pi "pm2 status"
```

### View Logs
```bash
ssh pi "pm2 logs pet-trainer-bot"
```

### Restart Bot
```bash
ssh pi "pm2 restart pet-trainer-bot"
```

### Pull Database to Mac
```bash
./scripts/sync-pi-db.sh pull
```

### Create Backup
```bash
./scripts/sync-pi-db.sh backup
```

### Update Bot
```bash
ssh pi "cd ~/apps/pet-trainer-bot && git pull && npm install && npm run build && pm2 restart pet-trainer-bot"
```

---

## 🆘 Need Help?

### Quick Troubleshooting

**Bot won't start?**
```bash
ssh pi "pm2 logs pet-trainer-bot --err"
```

**Bot not responding?**
- Check bot is running: `ssh pi "pm2 status"`
- Verify .env file is correct
- Check logs for errors

**Can't connect to Pi?**
```bash
ping raspberrypi.local
# or find IP:
arp -a | grep -i "b8:27:eb\|dc:a6:32\|e4:5f:01"
```

### Documentation

- **Troubleshooting**: See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md#troubleshooting)
- **PM2 Issues**: See [PM2_COMMANDS.md](PM2_COMMANDS.md#troubleshooting-commands)
- **Database Issues**: See [REMOTE_DB_ACCESS.md](REMOTE_DB_ACCESS.md#troubleshooting)

---

## 🔒 Security Notes

1. **Use SSH keys** (not passwords) - Setup guide covers this
2. **Keep Pi updated** - `ssh pi "sudo apt update && sudo apt upgrade"`
3. **Regular backups** - Automated backups protect your data
4. **Firewall** - Consider enabling UFW on Pi
5. **Database access** - Only via SSH (secure by default)

---

## 📊 System Architecture

```
┌─────────────────┐
│   Your Mac      │
│                 │
│  • Development  │
│  • Monitoring   │
│  • DB Access    │
│  • Backups      │
└────────┬────────┘
         │ SSH/SCP
         ▼
┌─────────────────┐
│ Raspberry Pi 5  │
│                 │
│  ┌───────────┐  │
│  │    PM2    │  │ ◄── Process Manager
│  │           │  │
│  │  ┌─────┐  │  │
│  │  │ Bot │  │  │ ◄── Your Bot
│  │  └──┬──┘  │  │
│  └─────┼─────┘  │
│        │        │
│  ┌─────▼─────┐  │
│  │ SQLite DB │  │ ◄── Database
│  └───────────┘  │
└────────┬────────┘
         │ Telegram API
         ▼
┌─────────────────┐
│ Telegram        │
│ Servers         │
└─────────────────┘
```

---

## 🎓 Learning Path

### Beginner
1. Start with [PI_QUICKSTART.md](PI_QUICKSTART.md)
2. Test basic commands
3. Learn from [PM2_COMMANDS.md](PM2_COMMANDS.md)

### Intermediate
1. Read [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
2. Set up automated backups
3. Explore [REMOTE_DB_ACCESS.md](REMOTE_DB_ACCESS.md)

### Advanced
1. Customize `ecosystem.config.cjs`
2. Set up monitoring dashboards
3. Implement custom deployment workflows

---

## ✨ What's Next?

After deployment:

1. ✅ **Test thoroughly** - Try all bot commands
2. ✅ **Set up backups** - Automate daily backups
3. ✅ **Monitor regularly** - Check logs and status
4. ✅ **Customize** - Adjust settings to your needs
5. ✅ **Document** - Note any custom configurations

---

## 🎉 Ready to Start?

Choose your path:

- 🏃 **Quick & Easy**: [PI_QUICKSTART.md](PI_QUICKSTART.md)
- 📚 **Detailed Guide**: [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
- ✅ **Checklist**: [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)

---

## 📞 Support

**Having issues?**

1. Check the troubleshooting section in the relevant guide
2. Review logs: `ssh pi "pm2 logs pet-trainer-bot --err"`
3. Check PM2 status: `ssh pi "pm2 status"`
4. Review this documentation

---

## 📝 Quick Reference Card

| What | Command |
|------|---------|
| SSH to Pi | `ssh pi` |
| Bot status | `ssh pi "pm2 status"` |
| View logs | `ssh pi "pm2 logs pet-trainer-bot"` |
| Restart | `ssh pi "pm2 restart pet-trainer-bot"` |
| Pull DB | `./scripts/sync-pi-db.sh pull` |
| Backup DB | `./scripts/sync-pi-db.sh backup` |
| DB status | `./scripts/sync-pi-db.sh status` |

---

## 🏆 Success Criteria

Your deployment is successful when:

- ✅ Bot responds to `/start` in Telegram
- ✅ PM2 shows status as "online"
- ✅ No errors in logs
- ✅ Bot survives Pi reboot
- ✅ Can access database from Mac
- ✅ Backups are working

---

**Let's get started! Choose your guide above and let's deploy your bot! 🚀**

