# PM2 Command Reference

Quick reference guide for managing your Pet Training Bot with PM2 on Raspberry Pi 5.

## Basic Commands

### Starting the Bot

```bash
# Start with ecosystem config
pm2 start ecosystem.config.cjs

# Start with specific environment
pm2 start ecosystem.config.cjs --env production
pm2 start ecosystem.config.cjs --env test

# Start and save configuration
pm2 start ecosystem.config.cjs
pm2 save
```

### Stopping and Restarting

```bash
# Stop the bot
pm2 stop pet-trainer-bot

# Restart the bot
pm2 restart pet-trainer-bot

# Reload (graceful restart with zero-downtime)
pm2 reload pet-trainer-bot

# Delete from PM2
pm2 delete pet-trainer-bot
```

### Monitoring

```bash
# Show status of all apps
pm2 status
pm2 list

# Real-time monitoring dashboard
pm2 monit

# Show detailed info
pm2 show pet-trainer-bot

# Display logs
pm2 logs pet-trainer-bot

# Display only error logs
pm2 logs pet-trainer-bot --err

# Display only standard output
pm2 logs pet-trainer-bot --out

# Display logs with timestamp
pm2 logs pet-trainer-bot --timestamp

# Clear logs
pm2 flush
```

### Process Management

```bash
# Save current process list
pm2 save

# Resurrect saved process list
pm2 resurrect

# Reset restart counter
pm2 reset pet-trainer-bot

# Update PM2
pm2 update
```

## Startup Configuration

```bash
# Generate startup script
pm2 startup

# Save current process list to resurrect on reboot
pm2 save

# Disable startup script
pm2 unstartup

# Update startup script
pm2 startup systemd -u $USER --hp $HOME
```

## Log Management

```bash
# Install log rotation module
pm2 install pm2-logrotate

# Configure log rotation
pm2 set pm2-logrotate:max_size 10M      # Max file size before rotation
pm2 set pm2-logrotate:retain 7          # Keep 7 rotated logs
pm2 set pm2-logrotate:compress true     # Compress rotated logs
pm2 set pm2-logrotate:rotateInterval '0 0 * * *'  # Rotate daily at midnight

# View log rotation settings
pm2 conf pm2-logrotate
```

## Advanced Commands

### Environment Variables

```bash
# Start with custom env vars
pm2 start ecosystem.config.cjs --env production --update-env

# Set env var for running process
pm2 restart pet-trainer-bot --update-env
```

### Performance Monitoring

```bash
# Enable detailed monitoring
pm2 install pm2-server-monit

# Web-based monitoring (requires pm2 plus)
pm2 plus
```

### Process Information

```bash
# Show process details
pm2 describe pet-trainer-bot

# Show process environment
pm2 env 0

# Show process metadata
pm2 prettylist
```

## Troubleshooting Commands

### When Bot Won't Start

```bash
# Check logs for errors
pm2 logs pet-trainer-bot --lines 100

# Check if port is in use
sudo lsof -i :3000  # adjust port if needed

# Delete and restart fresh
pm2 delete pet-trainer-bot
pm2 start ecosystem.config.cjs
pm2 save
```

### When Bot Keeps Restarting

```bash
# Check restart count
pm2 list

# View error logs
pm2 logs pet-trainer-bot --err --lines 50

# Increase restart delay
pm2 delete pet-trainer-bot
# Edit ecosystem.config.cjs to increase restart_delay
pm2 start ecosystem.config.cjs
```

### Memory Issues

```bash
# Check memory usage
pm2 monit

# Check detailed memory info
pm2 describe pet-trainer-bot | grep memory

# Restart if memory is high
pm2 restart pet-trainer-bot
```

### Database Lock Issues

```bash
# Stop bot to release database
pm2 stop pet-trainer-bot

# Check if database is still locked
lsof training.db

# Restart bot
pm2 start pet-trainer-bot
```

## Useful One-Liners

```bash
# Quick restart and view logs
pm2 restart pet-trainer-bot && pm2 logs pet-trainer-bot

# Stop, rebuild, and start
pm2 stop pet-trainer-bot && npm run build && pm2 start pet-trainer-bot

# Check if bot is running
pm2 list | grep pet-trainer-bot

# Get bot uptime
pm2 describe pet-trainer-bot | grep uptime

# Watch logs in real-time
pm2 logs pet-trainer-bot --raw | grep "📨\|❌\|✅"

# Restart and save
pm2 restart pet-trainer-bot && pm2 save
```

## Remote Management (from Mac)

```bash
# Check status remotely
ssh pi "pm2 status"

# View logs remotely
ssh pi "pm2 logs pet-trainer-bot --lines 50"

# Restart remotely
ssh pi "pm2 restart pet-trainer-bot"

# Update and restart
ssh pi "cd ~/apps/pet-trainer-bot && git pull && npm install && npm run build && pm2 restart pet-trainer-bot"
```

## Backup and Restore

```bash
# Backup PM2 configuration
pm2 save
cp ~/.pm2/dump.pm2 ~/pm2-backup-$(date +%Y%m%d).json

# Restore PM2 configuration
pm2 resurrect
```

## Ecosystem File Management

```bash
# Start with specific config file
pm2 start ecosystem.config.cjs

# Reload with updated config
pm2 reload ecosystem.config.cjs

# Delete all and restart with config
pm2 delete all
pm2 start ecosystem.config.cjs
pm2 save
```

## Testing Changes

```bash
# Test in test mode
pm2 start ecosystem.config.cjs --env test

# Watch logs for test mode indicators
pm2 logs pet-trainer-bot | grep "TEST MODE"

# Switch back to production
pm2 restart pet-trainer-bot --env production
```

## Health Checks

```bash
# Check bot health
pm2 describe pet-trainer-bot

# Check system resources
pm2 monit

# Check if bot is responding
ssh pi "pm2 logs pet-trainer-bot --lines 10 | grep '📨'"

# Full health check
pm2 list && pm2 logs pet-trainer-bot --lines 5
```

## Automated Maintenance Script

Create `~/bin/pm2-maintain.sh` on your Pi:

```bash
#!/bin/bash
echo "🔧 PM2 Maintenance"
pm2 flush                    # Clear old logs
pm2 restart pet-trainer-bot  # Restart bot
pm2 save                     # Save configuration
echo "✅ Maintenance complete"
```

Run weekly:
```bash
chmod +x ~/bin/pm2-maintain.sh
crontab -e
# Add: 0 3 * * 0 ~/bin/pm2-maintain.sh  # Every Sunday at 3 AM
```

## Emergency Commands

```bash
# Nuclear option - restart everything
pm2 kill
pm2 start ecosystem.config.cjs
pm2 save

# Check PM2 daemon status
pm2 ping

# Restart PM2 daemon
pm2 kill
pm2 resurrect
```

## Performance Tuning

```bash
# Check event loop lag
pm2 describe pet-trainer-bot | grep "event loop"

# Monitor CPU usage
pm2 monit

# Set max memory restart threshold
# Edit ecosystem.config.cjs: max_memory_restart: '200M'
pm2 reload ecosystem.config.cjs
```

## Useful Aliases (Add to ~/.bashrc or ~/.zshrc)

```bash
# PM2 aliases for quick access
alias pm2s='pm2 status'
alias pm2l='pm2 logs pet-trainer-bot'
alias pm2r='pm2 restart pet-trainer-bot'
alias pm2m='pm2 monit'
alias pm2i='pm2 describe pet-trainer-bot'
```

---

## Quick Start Checklist

After setting up on Pi:

- [ ] `pm2 start ecosystem.config.cjs`
- [ ] `pm2 save`
- [ ] `pm2 startup` (run the command it outputs)
- [ ] `pm2 logs pet-trainer-bot` (verify it's working)
- [ ] Test with `/start` command in Telegram

---

## Common Issues and Solutions

| Issue | Command | Solution |
|-------|---------|----------|
| Bot not starting | `pm2 logs pet-trainer-bot --err` | Check error logs |
| High memory | `pm2 restart pet-trainer-bot` | Restart to clear memory |
| Database locked | `pm2 stop pet-trainer-bot` | Stop bot, fix DB, restart |
| Logs too large | `pm2 flush` | Clear all logs |
| Lost configuration | `pm2 resurrect` | Restore saved config |
| PM2 not responding | `pm2 kill && pm2 resurrect` | Restart PM2 daemon |

---

For more information: `pm2 --help` or visit [PM2 Documentation](https://pm2.keymetrics.io/docs/)

