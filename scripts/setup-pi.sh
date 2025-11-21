#!/bin/bash

##############################################################################
# Setup Script for Raspberry Pi 5
# This script prepares your Pi for running the Pet Training Bot with PM2
##############################################################################

set -e  # Exit on error

echo "🍓 Pet Training Bot - Raspberry Pi 5 Setup"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running on Raspberry Pi
if [ ! -f /proc/device-tree/model ] || ! grep -q "Raspberry Pi" /proc/device-tree/model; then
    echo -e "${YELLOW}⚠️  Warning: This doesn't appear to be a Raspberry Pi${NC}"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# 1. Update system
echo -e "${GREEN}📦 Updating system packages...${NC}"
sudo apt update
sudo apt upgrade -y

# 2. Install Node.js (if not already installed)
if ! command -v node &> /dev/null; then
    echo -e "${GREEN}📦 Installing Node.js...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
else
    echo -e "${GREEN}✅ Node.js already installed: $(node --version)${NC}"
fi

# 3. Install PM2 globally
if ! command -v pm2 &> /dev/null; then
    echo -e "${GREEN}📦 Installing PM2...${NC}"
    sudo npm install -g pm2
else
    echo -e "${GREEN}✅ PM2 already installed: $(pm2 --version)${NC}"
fi

# 4. Install SQLite3 (if not already installed)
if ! command -v sqlite3 &> /dev/null; then
    echo -e "${GREEN}📦 Installing SQLite3...${NC}"
    sudo apt install -y sqlite3
else
    echo -e "${GREEN}✅ SQLite3 already installed: $(sqlite3 --version)${NC}"
fi

# 5. Create necessary directories
echo -e "${GREEN}📁 Creating directories...${NC}"
mkdir -p logs
mkdir -p backups

# 6. Set up log rotation for PM2
echo -e "${GREEN}📝 Setting up PM2 log rotation...${NC}"
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true

# 7. Build the project
if [ -f "package.json" ]; then
    echo -e "${GREEN}🔨 Installing dependencies and building...${NC}"
    npm install
    npm run build
else
    echo -e "${RED}❌ package.json not found. Are you in the project directory?${NC}"
    exit 1
fi

# 8. Check for .env file
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  .env file not found!${NC}"
    echo "Please create a .env file with your configuration:"
    echo ""
    echo "TELEGRAM_BOT_TOKEN=your_bot_token"
    echo "OWNER_TELEGRAM_ID=your_telegram_id"
    echo ""
    read -p "Press Enter to continue after creating .env file..."
fi

# 9. Set up PM2 to start on boot
echo -e "${GREEN}🚀 Configuring PM2 to start on boot...${NC}"
pm2 startup systemd -u $USER --hp $HOME
echo -e "${YELLOW}⚠️  If you see a command above, run it to complete the setup${NC}"

# 10. Set proper permissions for database
echo -e "${GREEN}🔒 Setting database permissions...${NC}"
if [ -f "training.db" ]; then
    chmod 664 training.db
    echo "✅ Database permissions set"
else
    echo "ℹ️  Database will be created on first run"
fi

echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Make sure your .env file is configured"
echo "2. Start the bot with: pm2 start ecosystem.config.cjs"
echo "3. Save PM2 configuration: pm2 save"
echo "4. View logs: pm2 logs pet-trainer-bot"
echo "5. Monitor: pm2 monit"
echo ""
echo "For remote database access from your Mac, see: REMOTE_DB_ACCESS.md"

