# Remote Database Access from Mac to Raspberry Pi

This guide explains how to access the SQLite database on your Raspberry Pi 5 from your Mac.

## Quick Start (For Database IDEs)

**Want to use DataGrip, DBeaver, or TablePlus?** The simplest method is to mount your Pi as a local drive:

```bash
# Install SSHFS (one-time setup)
brew install --cask macfuse
brew install gromgit/fuse/sshfs-mac

# Mount your Pi
mkdir -p ~/mnt/pi
sshfs pi:/home/luc-b/apps/pet-trainer-bot ~/mnt/pi

# Open in your IDE
# Path: ~/mnt/pi/data/training.db
```

See [Option 1](#option-1-mount-pi-filesystem-simplest-for-db-ides) for detailed instructions.

---

## Table of Contents

- [Option 1: Mount Pi Filesystem (Simplest for DB IDEs)](#option-1-mount-pi-filesystem-simplest-for-db-ides)
- [Option 2: Database Sync Script](#option-2-database-sync-script)
- [Option 3: SSH Tunnel + SQLite Client](#option-3-ssh-tunnel--sqlite-client)
- [GUI Database Tools](#gui-database-tools)
- [Troubleshooting](#troubleshooting)

---

## Option 1: Mount Pi Filesystem (Simplest for DB IDEs)

**⭐ Recommended for DataGrip, DBeaver, TablePlus, and other database IDEs**

This method mounts your Pi's filesystem as a local drive on your Mac, making the database file accessible as if it were local. This is the simplest way to use any database IDE.

### Install SSHFS on Mac

```bash
# Install macFUSE and SSHFS
brew install --cask macfuse
brew install gromgit/fuse/sshfs-mac
```

**Note:** After installing macFUSE, you may need to:
1. Go to System Preferences → Security & Privacy
2. Allow the system extension from "Benjamin Fleischer"
3. Restart your Mac

### Mount Your Pi

```bash
# Create mount point
mkdir -p ~/mnt/pi

# Mount the Pi's filesystem
sshfs pi:/home/luc-b/apps/pet-trainer-bot ~/mnt/pi

# Verify it's mounted
ls ~/mnt/pi/data/
```

### Access Database in Your IDE

Now you can open the database in any IDE as a local file:

**Path to database:** `~/mnt/pi/data/training.db`

**For DataGrip:**
1. New Data Source → SQLite
2. File: `~/mnt/pi/data/training.db`
3. Test Connection → OK

**For DBeaver:**
1. Database → New Database Connection → SQLite
2. Path: `~/mnt/pi/data/training.db`
3. Test Connection → Finish

**For TablePlus:**
1. Create a new connection → SQLite
2. Database path: `~/mnt/pi/data/training.db`
3. Connect

### Unmount When Done

```bash
# Unmount the Pi
umount ~/mnt/pi

# Or on macOS:
diskutil unmount ~/mnt/pi
```

### Auto-mount on Login (Optional)

Create a script to mount automatically:

```bash
# Create mount script
cat > ~/bin/mount-pi.sh << 'EOF'
#!/bin/bash
mkdir -p ~/mnt/pi
sshfs pi:/home/luc-b/apps/pet-trainer-bot ~/mnt/pi -o reconnect,ServerAliveInterval=15,ServerAliveCountMax=3
echo "✅ Pi mounted at ~/mnt/pi"
EOF

chmod +x ~/bin/mount-pi.sh

# Run it
~/bin/mount-pi.sh
```

---

## Option 2: Database Sync Script

This method creates an SSH tunnel to access the database file remotely.

### Setup on Raspberry Pi

1. **Install SQLite HTTP server (optional but useful):**

```bash
# On your Pi
sudo apt install -y socat
```

2. **Ensure SSH is enabled:**

```bash
sudo systemctl enable ssh
sudo systemctl start ssh
```

### Setup on Mac

1. **Create an SSH config for easy access:**

```bash
# On your Mac
nano ~/.ssh/config
```

Add this configuration (adjust as needed):

```
Host pi
    HostName raspberrypi.local  # or use IP address like 192.168.1.100
    User pi                      # your Pi username
    Port 22
    IdentityFile ~/.ssh/id_rsa   # your SSH key
    ServerAliveInterval 60
    ServerAliveCountMax 3
```

2. **Test SSH connection:**

```bash
ssh pi
```

### Access Database via SSH

**Method A: Direct SQLite access via SSH**

```bash
# On your Mac - access SQLite CLI on Pi
ssh pi "sqlite3 ~/apps/pet-trainer-bot/training.db"

# Or run specific queries
ssh pi "sqlite3 ~/apps/pet-trainer-bot/training.db 'SELECT * FROM trainings;'"
```

**Method B: Copy database file temporarily**

```bash
# Copy from Pi to Mac
scp pi:~/apps/pet-trainer-bot/training.db ./training-local.db

# Open with local SQLite client
sqlite3 training-local.db

# When done, copy back (⚠️ DANGER: This will overwrite Pi database!)
# scp ./training-local.db pi:~/apps/pet-trainer-bot/training.db
```

---

## Option 3: SSH Tunnel + SQLite Client

This method provides command-line access to the database via SSH.

### Setup SSH Config

If you haven't already, create an SSH config for easy access:

```bash
# On your Mac
nano ~/.ssh/config
```

Add this configuration (adjust as needed):

```
Host pi
    HostName 192.168.1.22       # or use raspberrypi.local
    User luc-b                   # your Pi username
    Port 22
    IdentityFile ~/.ssh/id_rsa   # your SSH key
    ServerAliveInterval 60
    ServerAliveCountMax 3
```

### Access Database via SSH

**Direct SQLite access via SSH**

```bash
# On your Mac - access SQLite CLI on Pi
ssh pi "sqlite3 ~/apps/pet-trainer-bot/data/training.db"

# Or run specific queries
ssh pi "sqlite3 ~/apps/pet-trainer-bot/data/training.db 'SELECT * FROM trainings;'"

# Copy database file temporarily
scp pi:~/apps/pet-trainer-bot/data/training.db ./training-local.db

# Open with local SQLite client
sqlite3 training-local.db
```

---

## Option 2: Database Sync Script

Automatically sync database changes between Pi and Mac using the included sync script.

### Create Sync Script on Mac

Create `~/bin/sync-pi-db.sh`:

```bash
#!/bin/bash

##############################################################################
# Database Sync Script - Mac to/from Raspberry Pi
##############################################################################

PI_HOST="pi"
PI_DB_PATH="~/apps/pet-trainer-bot/training.db"
LOCAL_DB_PATH="$HOME/Documents/Perso/PetTrainerNotificationBot/training.db"
BACKUP_DIR="$HOME/Documents/Perso/PetTrainerNotificationBot/backups"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Create backup directory
mkdir -p "$BACKUP_DIR"

case "$1" in
  pull)
    echo -e "${GREEN}📥 Pulling database from Pi...${NC}"
    
    # Backup local database if it exists
    if [ -f "$LOCAL_DB_PATH" ]; then
      BACKUP_FILE="$BACKUP_DIR/training-$(date +%Y%m%d-%H%M%S).db"
      cp "$LOCAL_DB_PATH" "$BACKUP_FILE"
      echo -e "${YELLOW}💾 Local backup saved: $BACKUP_FILE${NC}"
    fi
    
    # Pull from Pi
    scp "$PI_HOST:$PI_DB_PATH" "$LOCAL_DB_PATH"
    echo -e "${GREEN}✅ Database pulled successfully${NC}"
    ;;
    
  push)
    echo -e "${YELLOW}⚠️  WARNING: This will overwrite the database on your Pi!${NC}"
    read -p "Are you sure? (yes/no): " -r
    if [ "$REPLY" = "yes" ]; then
      echo -e "${GREEN}📤 Pushing database to Pi...${NC}"
      
      # Backup Pi database first
      ssh "$PI_HOST" "mkdir -p ~/apps/pet-trainer-bot/backups"
      ssh "$PI_HOST" "cp $PI_DB_PATH ~/apps/pet-trainer-bot/backups/training-\$(date +%Y%m%d-%H%M%S).db"
      
      # Push to Pi
      scp "$LOCAL_DB_PATH" "$PI_HOST:$PI_DB_PATH"
      
      # Restart bot to pick up changes
      ssh "$PI_HOST" "pm2 restart pet-trainer-bot"
      
      echo -e "${GREEN}✅ Database pushed and bot restarted${NC}"
    else
      echo "Cancelled"
    fi
    ;;
    
  backup)
    echo -e "${GREEN}💾 Creating backup from Pi...${NC}"
    BACKUP_FILE="$BACKUP_DIR/training-$(date +%Y%m%d-%H%M%S).db"
    scp "$PI_HOST:$PI_DB_PATH" "$BACKUP_FILE"
    echo -e "${GREEN}✅ Backup saved: $BACKUP_FILE${NC}"
    ;;
    
  status)
    echo -e "${GREEN}📊 Database Status${NC}"
    echo ""
    echo "Local:"
    if [ -f "$LOCAL_DB_PATH" ]; then
      ls -lh "$LOCAL_DB_PATH"
      echo "Records: $(sqlite3 "$LOCAL_DB_PATH" 'SELECT COUNT(*) FROM trainings;')"
    else
      echo "Not found"
    fi
    echo ""
    echo "Remote (Pi):"
    ssh "$PI_HOST" "ls -lh $PI_DB_PATH && sqlite3 $PI_DB_PATH 'SELECT COUNT(*) FROM trainings;'"
    ;;
    
  *)
    echo "Usage: $0 {pull|push|backup|status}"
    echo ""
    echo "Commands:"
    echo "  pull   - Download database from Pi to Mac"
    echo "  push   - Upload database from Mac to Pi (⚠️  overwrites Pi database)"
    echo "  backup - Create a backup copy from Pi"
    echo "  status - Show database info on both systems"
    exit 1
    ;;
esac
```

Make it executable:

```bash
chmod +x ~/bin/sync-pi-db.sh
```

### Usage

```bash
# Pull database from Pi to Mac
~/bin/scripts/sync-pi-db.sh pull

# Push database from Mac to Pi (careful!)
~/bin/scripts/sync-pi-db.sh push

# Create backup
~/bin/scripts/sync-pi-db.sh backup

# Check status
~/bin/scripts/sync-pi-db.sh status
```

---

## GUI Database Tools

### Recommended Tools for Mac

1. **DB Browser for SQLite** (Free)
   ```bash
   brew install --cask db-browser-for-sqlite
   ```
   - Open source and feature-rich
   - Great for browsing and editing

2. **TablePlus** (Free tier available)
   ```bash
   brew install --cask tableplus
   ```
   - Modern interface
   - Supports SSH tunneling directly

3. **DBeaver** (Free)
   ```bash
   brew install --cask dbeaver-community
   ```
   - Universal database tool
   - Can connect via SSH tunnel

### Using TablePlus with SSH Tunnel

1. Open TablePlus
2. Create new connection → SQLite
3. Enable "Over SSH"
4. SSH settings:
   - Host: `raspberrypi.local` (or IP)
   - User: `pi`
   - Password or Key: (your credentials)
5. Database path: `/home/pi/apps/pet-trainer-bot/training.db`

---

## Quick Reference Commands

### On Mac

```bash
# Quick query via SSH
ssh pi "sqlite3 ~/apps/pet-trainer-bot/training.db 'SELECT * FROM trainings;'"

# Copy database to Mac
scp pi:~/apps/pet-trainer-bot/training.db ./training-local.db

# Open with local SQLite
sqlite3 training-local.db

# View all trainings
sqlite3 training-local.db "SELECT user_id, npc_type, is_active, end_iso FROM trainings;"

# Check active trainings
sqlite3 training-local.db "SELECT * FROM trainings WHERE is_active = 1;"
```

### On Pi (via SSH)

```bash
# Connect to Pi
ssh pi

# Navigate to project
cd ~/apps/pet-trainer-bot

# Open database
sqlite3 training.db

# Useful SQLite commands:
.tables              # List tables
.schema trainings    # Show table structure
SELECT * FROM trainings;  # View all data
.quit                # Exit SQLite
```

---

## Troubleshooting

### Cannot Connect via SSH

1. **Check Pi is reachable:**
   ```bash
   ping raspberrypi.local
   # or
   ping 192.168.1.XXX  # your Pi's IP
   ```

2. **Find Pi's IP address:**
   ```bash
   # On Pi
   hostname -I
   ```

3. **Ensure SSH is running on Pi:**
   ```bash
   # On Pi
   sudo systemctl status ssh
   ```

### Database is Locked

If you get "database is locked" error:

1. **Check if bot is running:**
   ```bash
   ssh pi "pm2 status"
   ```

2. **Temporarily stop bot:**
   ```bash
   ssh pi "pm2 stop pet-trainer-bot"
   # Do your database work
   ssh pi "pm2 start pet-trainer-bot"
   ```

3. **Use read-only mode:**
   ```bash
   sqlite3 file:training.db?mode=ro
   ```

### SSHFS Not Working on Mac

1. **Check macFUSE is installed:**
   ```bash
   brew list macfuse
   ```

2. **Restart Mac** after installing macFUSE

3. **Check System Settings:**
   - System Settings → Privacy & Security
   - Allow system extension from "Benjamin Fleischer"

### Permission Denied

```bash
# On Pi - ensure correct permissions
chmod 664 ~/apps/pet-trainer-bot/training.db
chmod 775 ~/apps/pet-trainer-bot
```

---

## Security Best Practices

1. **Use SSH keys instead of passwords:**
   ```bash
   # Generate key if you don't have one
   ssh-keygen -t ed25519 -C "your_email@example.com"
   
   # Copy to Pi
   ssh-copy-id pi@raspberrypi.local
   ```

2. **Never push database changes while bot is running** (unless you know what you're doing)

3. **Always backup before pushing changes:**
   ```bash
   ~/bin/scripts/sync-pi-db.sh backup
   ```

4. **Use read-only access when just viewing:**
   ```bash
   sqlite3 file:training.db?mode=ro
   ```

---

## Automated Backup Cron Job (Optional)

Create automatic daily backups from Pi to Mac:

```bash
# On Mac - edit crontab
crontab -e

# Add this line (runs daily at 2 AM)
0 2 * * * /Users/yourusername/bin/scripts/sync-pi-db.sh backup
```

---

## Summary

**For quick viewing:** Use SSH + SQLite CLI  
**For regular access:** Use SSHFS to mount Pi filesystem  
**For GUI access:** Use TablePlus with SSH tunnel  
**For syncing:** Use the sync script provided  

Choose the method that best fits your workflow! 🚀

