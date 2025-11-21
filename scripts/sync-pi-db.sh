#!/bin/bash

##############################################################################
# Database Sync Script - Mac to/from Raspberry Pi
# 
# This script helps you sync the SQLite database between your Mac and Pi
# Usage: ./sync-pi-db.sh {pull|push|backup|status}
##############################################################################

# Configuration - EDIT THESE VALUES
PI_HOST="pi"  # SSH host (from ~/.ssh/config) or use "pi@raspberrypi.local"
PI_DB_PATH="~/apps/pet-trainer-bot/data/training.db"
LOCAL_DB_PATH="$HOME/Documents/Perso/PetTrainerNotificationBot/data/training.db"
BACKUP_DIR="$HOME/Documents/Perso/PetTrainerNotificationBot/data/backups"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Function to check if Pi is reachable
check_connection() {
    echo -e "${BLUE}🔍 Checking connection to Pi...${NC}"
    if ssh -o ConnectTimeout=5 "$PI_HOST" "echo 'Connected'" &>/dev/null; then
        echo -e "${GREEN}✅ Connected to Pi${NC}"
        return 0
    else
        echo -e "${RED}❌ Cannot connect to Pi${NC}"
        echo "Please check:"
        echo "  1. Pi is powered on and connected to network"
        echo "  2. SSH is enabled on Pi"
        echo "  3. PI_HOST is set correctly in this script"
        return 1
    fi
}

# Function to create backup
create_backup() {
    local source=$1
    local backup_name=$2
    
    if [ -f "$source" ]; then
        BACKUP_FILE="$BACKUP_DIR/${backup_name}-$(date +%Y%m%d-%H%M%S).db"
        cp "$source" "$BACKUP_FILE"
        echo -e "${YELLOW}💾 Backup saved: $BACKUP_FILE${NC}"
        return 0
    fi
    return 1
}

# Main command handling
case "$1" in
  pull)
    echo -e "${GREEN}📥 Pulling database from Pi to Mac...${NC}"
    echo ""
    
    # Check connection
    check_connection || exit 1
    
    # Backup local database if it exists
    if [ -f "$LOCAL_DB_PATH" ]; then
        create_backup "$LOCAL_DB_PATH" "local-before-pull"
    fi
    
    # Pull from Pi
    echo -e "${BLUE}⬇️  Downloading database...${NC}"
    if scp "$PI_HOST:$PI_DB_PATH" "$LOCAL_DB_PATH"; then
        echo -e "${GREEN}✅ Database pulled successfully!${NC}"
        echo ""
        echo "Local database updated: $LOCAL_DB_PATH"
        
        # Show record count
        if command -v sqlite3 &> /dev/null; then
            RECORD_COUNT=$(sqlite3 "$LOCAL_DB_PATH" 'SELECT COUNT(*) FROM trainings;' 2>/dev/null || echo "N/A")
            echo "Records in database: $RECORD_COUNT"
        fi
    else
        echo -e "${RED}❌ Failed to pull database${NC}"
        exit 1
    fi
    ;;
    
  push)
    echo -e "${YELLOW}⚠️  WARNING: This will overwrite the database on your Pi!${NC}"
    echo ""
    
    # Check if local database exists
    if [ ! -f "$LOCAL_DB_PATH" ]; then
        echo -e "${RED}❌ Local database not found: $LOCAL_DB_PATH${NC}"
        exit 1
    fi
    
    # Show what will be pushed
    if command -v sqlite3 &> /dev/null; then
        LOCAL_COUNT=$(sqlite3 "$LOCAL_DB_PATH" 'SELECT COUNT(*) FROM trainings;' 2>/dev/null || echo "N/A")
        echo "Local database has $LOCAL_COUNT records"
    fi
    
    echo ""
    read -p "Are you sure you want to push? Type 'yes' to confirm: " -r
    echo ""
    
    if [ "$REPLY" = "yes" ]; then
        # Check connection
        check_connection || exit 1
        
        echo -e "${BLUE}📤 Pushing database to Pi...${NC}"
        
        # Backup Pi database first
        echo "Creating backup on Pi..."
        ssh "$PI_HOST" "mkdir -p ~/apps/pet-trainer-bot/backups"
        ssh "$PI_HOST" "cp $PI_DB_PATH ~/apps/pet-trainer-bot/backups/training-\$(date +%Y%m%d-%H%M%S).db" 2>/dev/null
        
        # Stop the bot
        echo "Stopping bot on Pi..."
        ssh "$PI_HOST" "pm2 stop pet-trainer-bot" 2>/dev/null
        
        # Push to Pi
        if scp "$LOCAL_DB_PATH" "$PI_HOST:$PI_DB_PATH"; then
            echo -e "${GREEN}✅ Database pushed successfully${NC}"
            
            # Restart bot
            echo "Restarting bot on Pi..."
            ssh "$PI_HOST" "pm2 start pet-trainer-bot"
            
            echo -e "${GREEN}✅ Bot restarted${NC}"
        else
            echo -e "${RED}❌ Failed to push database${NC}"
            # Try to restart bot anyway
            ssh "$PI_HOST" "pm2 start pet-trainer-bot"
            exit 1
        fi
    else
        echo "Push cancelled"
        exit 0
    fi
    ;;
    
  backup)
    echo -e "${GREEN}💾 Creating backup from Pi...${NC}"
    
    # Check connection
    check_connection || exit 1
    
    BACKUP_FILE="$BACKUP_DIR/pi-backup-$(date +%Y%m%d-%H%M%S).db"
    
    if scp "$PI_HOST:$PI_DB_PATH" "$BACKUP_FILE"; then
        echo -e "${GREEN}✅ Backup saved: $BACKUP_FILE${NC}"
        
        # Show record count
        if command -v sqlite3 &> /dev/null; then
            RECORD_COUNT=$(sqlite3 "$BACKUP_FILE" 'SELECT COUNT(*) FROM trainings;' 2>/dev/null || echo "N/A")
            echo "Records in backup: $RECORD_COUNT"
        fi
    else
        echo -e "${RED}❌ Failed to create backup${NC}"
        exit 1
    fi
    ;;
    
  status)
    echo -e "${BLUE}📊 Database Status${NC}"
    echo "===================="
    echo ""
    
    # Local database
    echo -e "${GREEN}Local (Mac):${NC}"
    if [ -f "$LOCAL_DB_PATH" ]; then
        ls -lh "$LOCAL_DB_PATH" | awk '{print "  Size: " $5 "  Modified: " $6 " " $7 " " $8}'
        if command -v sqlite3 &> /dev/null; then
            RECORD_COUNT=$(sqlite3 "$LOCAL_DB_PATH" 'SELECT COUNT(*) FROM trainings;' 2>/dev/null || echo "Error")
            ACTIVE_COUNT=$(sqlite3 "$LOCAL_DB_PATH" 'SELECT COUNT(*) FROM trainings WHERE is_active = 1;' 2>/dev/null || echo "Error")
            echo "  Records: $RECORD_COUNT (Active: $ACTIVE_COUNT)"
        fi
    else
        echo "  ❌ Not found: $LOCAL_DB_PATH"
    fi
    echo ""
    
    # Remote database
    echo -e "${GREEN}Remote (Pi):${NC}"
    if check_connection; then
        ssh "$PI_HOST" "ls -lh $PI_DB_PATH 2>/dev/null" | awk '{print "  Size: " $5 "  Modified: " $6 " " $7 " " $8}'
        REMOTE_COUNT=$(ssh "$PI_HOST" "sqlite3 $PI_DB_PATH 'SELECT COUNT(*) FROM trainings;' 2>/dev/null" || echo "Error")
        REMOTE_ACTIVE=$(ssh "$PI_HOST" "sqlite3 $PI_DB_PATH 'SELECT COUNT(*) FROM trainings WHERE is_active = 1;' 2>/dev/null" || echo "Error")
        echo "  Records: $REMOTE_COUNT (Active: $REMOTE_ACTIVE)"
        
        # Bot status
        echo ""
        echo -e "${GREEN}Bot Status:${NC}"
        ssh "$PI_HOST" "pm2 status pet-trainer-bot 2>/dev/null" | grep pet-trainer-bot || echo "  ❌ Bot not running or PM2 not found"
    fi
    echo ""
    
    # Backups
    echo -e "${GREEN}Backups:${NC}"
    BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/*.db 2>/dev/null | wc -l)
    echo "  Total backups: $BACKUP_COUNT"
    if [ "$BACKUP_COUNT" -gt 0 ]; then
        echo "  Latest backup:"
        ls -lht "$BACKUP_DIR"/*.db 2>/dev/null | head -1 | awk '{print "    " $9 " (" $5 ", " $6 " " $7 " " $8 ")"}'
    fi
    ;;
    
  query)
    if [ -z "$2" ]; then
        echo "Usage: $0 query \"SQL QUERY\""
        echo "Example: $0 query \"SELECT * FROM trainings WHERE is_active = 1;\""
        exit 1
    fi
    
    echo -e "${BLUE}🔍 Running query on Pi database...${NC}"
    check_connection || exit 1
    
    ssh "$PI_HOST" "sqlite3 -header -column $PI_DB_PATH \"$2\""
    ;;
    
  compare)
    echo -e "${BLUE}🔍 Comparing local and remote databases...${NC}"
    echo ""
    
    if [ ! -f "$LOCAL_DB_PATH" ]; then
        echo -e "${RED}❌ Local database not found${NC}"
        exit 1
    fi
    
    check_connection || exit 1
    
    # Get counts
    LOCAL_COUNT=$(sqlite3 "$LOCAL_DB_PATH" 'SELECT COUNT(*) FROM trainings;' 2>/dev/null)
    REMOTE_COUNT=$(ssh "$PI_HOST" "sqlite3 $PI_DB_PATH 'SELECT COUNT(*) FROM trainings;' 2>/dev/null")
    
    echo "Local records:  $LOCAL_COUNT"
    echo "Remote records: $REMOTE_COUNT"
    
    if [ "$LOCAL_COUNT" -eq "$REMOTE_COUNT" ]; then
        echo -e "${GREEN}✅ Record counts match${NC}"
    else
        echo -e "${YELLOW}⚠️  Record counts differ!${NC}"
    fi
    ;;
    
  *)
    echo "Pet Training Bot - Database Sync Tool"
    echo "======================================"
    echo ""
    echo "Usage: $0 {pull|push|backup|status|query|compare}"
    echo ""
    echo "Commands:"
    echo "  pull     - Download database from Pi to Mac"
    echo "  push     - Upload database from Mac to Pi (⚠️  overwrites Pi database)"
    echo "  backup   - Create a backup copy from Pi"
    echo "  status   - Show database info on both systems"
    echo "  query    - Run SQL query on Pi database"
    echo "  compare  - Compare record counts between local and remote"
    echo ""
    echo "Examples:"
    echo "  $0 pull"
    echo "  $0 status"
    echo "  $0 query \"SELECT * FROM trainings WHERE is_active = 1;\""
    echo ""
    echo "Configuration:"
    echo "  PI_HOST: $PI_HOST"
    echo "  Local DB: $LOCAL_DB_PATH"
    echo "  Backups: $BACKUP_DIR"
    exit 1
    ;;
esac

