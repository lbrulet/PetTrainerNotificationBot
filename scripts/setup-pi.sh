#!/bin/bash

##############################################################################
# Setup Script for Raspberry Pi 5
# This script prepares your Pi for running the Pet Training Bot with PM2
#
# FIRST TIME SETUP:
# 1. Clone the repository:
#    git clone https://github.com/lbrulet/PetTrainerNotificationBot.git
#    cd PetTrainerNotificationBot
# 2. Run this script:
#    chmod +x scripts/setup-pi.sh
#    ./scripts/setup-pi.sh
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

# 2. Install Git (if not already installed)
if ! command -v git &> /dev/null; then
    echo -e "${GREEN}📦 Installing Git...${NC}"
    sudo apt install -y git
else
    echo -e "${GREEN}✅ Git already installed: $(git --version)${NC}"
fi

# 3. Install Node.js (if not already installed)
if ! command -v node &> /dev/null; then
    echo -e "${GREEN}📦 Installing Node.js...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
else
    echo -e "${GREEN}✅ Node.js already installed: $(node --version)${NC}"
fi

# 4. Install PM2 globally
if ! command -v pm2 &> /dev/null; then
    echo -e "${GREEN}📦 Installing PM2...${NC}"
    sudo npm install -g pm2
else
    echo -e "${GREEN}✅ PM2 already installed: $(pm2 --version)${NC}"
fi

# 5. Install SQLite3 (if not already installed)
if ! command -v sqlite3 &> /dev/null; then
    echo -e "${GREEN}📦 Installing SQLite3...${NC}"
    sudo apt install -y sqlite3
else
    echo -e "${GREEN}✅ SQLite3 already installed: $(sqlite3 --version)${NC}"
fi

# 6. Create necessary directories
echo -e "${GREEN}📁 Creating directories...${NC}"
mkdir -p logs
mkdir -p backups

# 7. Set up log rotation for PM2
echo -e "${GREEN}📝 Setting up PM2 log rotation...${NC}"
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true

# 8. Pull latest code from git
if [ -d ".git" ]; then
    echo -e "${GREEN}🔄 Pulling latest code from git...${NC}"
    git pull
else
    echo -e "${YELLOW}⚠️  Not a git repository, skipping git pull${NC}"
fi

# 9. Build the project
if [ -f "package.json" ]; then
    echo -e "${GREEN}🔨 Installing dependencies and building...${NC}"
    npm install
    npm run build
else
    echo -e "${RED}❌ package.json not found. Are you in the project directory?${NC}"
    exit 1
fi

# 10. Configure .env file
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  .env file not found!${NC}"
    echo -e "${GREEN}Let's create it now...${NC}"
    echo ""
    
    # Prompt for Telegram Bot Token
    echo -e "${YELLOW}📱 Get your bot token from @BotFather on Telegram${NC}"
    read -p "Enter your TELEGRAM_BOT_TOKEN: " BOT_TOKEN
    
    # Prompt for Owner Telegram ID
    echo ""
    echo -e "${YELLOW}👤 Get your Telegram ID from @userinfobot${NC}"
    read -p "Enter your OWNER_TELEGRAM_ID: " OWNER_ID
    
    # Create .env file
    cat > .env << EOF
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=${BOT_TOKEN}
OWNER_TELEGRAM_ID=${OWNER_ID}

# Optional: Enable test mode for faster timers (true/false)
# TEST_MODE=false
EOF
    
    echo ""
    echo -e "${GREEN}✅ .env file created successfully!${NC}"
else
    echo -e "${GREEN}✅ .env file already exists${NC}"
fi

# 11. Set up PM2 to start on boot
echo -e "${GREEN}🚀 Configuring PM2 to start on boot...${NC}"
pm2 startup systemd -u $USER --hp $HOME
echo -e "${YELLOW}⚠️  If you see a command above, run it to complete the setup${NC}"

# 12. Set proper permissions for database
echo -e "${GREEN}🔒 Setting database permissions...${NC}"
if [ -f "data/training.db" ]; then
    chmod 664 data/training.db
    echo "✅ Database permissions set"
else
    echo "ℹ️  Database will be created on first run"
fi

# 13. Verify build output
if [ ! -f "build/index.js" ]; then
    echo -e "${RED}❌ Build failed - build/index.js not found${NC}"
    exit 1
fi

# 14. Start the bot with PM2
echo ""
echo -e "${GREEN}🚀 Starting the bot with PM2...${NC}"

# Stop existing instance if running
pm2 delete pet-trainer-bot 2>/dev/null || true

# Start the bot
pm2 start ecosystem.config.cjs --update-env

# Save PM2 configuration
pm2 save

# Show status
echo ""
pm2 status

echo ""
echo -e "${GREEN}✅ Setup complete! Bot is now running!${NC}"
echo ""
echo "Useful commands:"
echo "  pm2 status                    - Check bot status"
echo "  pm2 logs pet-trainer-bot      - View logs (Ctrl+C to exit)"
echo "  pm2 restart pet-trainer-bot   - Restart bot"
echo "  pm2 stop pet-trainer-bot      - Stop bot"
echo "  pm2 monit                     - Monitor in real-time"
echo ""
echo "For remote database access from your Mac, see: REMOTE_DB_ACCESS.md"

