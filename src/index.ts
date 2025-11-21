/**
 * Pet Training Notification Bot
 * Manages NPC training timers using Telegram and SQLite
 */

import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import { initializeDatabase } from './databaseService.js';
import { startScheduler, restartScheduler } from './scheduler.js';
import { isTestMode, AUTHORIZED_USERS } from './types.js';
import {
  handleStart,
  handleStatus,
  handleTrainC,
  handleTrainB,
  handleTrainA,
  handleStopC,
  handleStopB,
  handleStopA,
  handleRentalC,
  handleRentalB,
  handleRentalA,
  handleTestMode,
} from './botCommands.js';
import { handleCallbackQuery } from './callbackHandlers.js';

// Load environment variables
dotenv.config();

// Validate required environment variables
function validateEnv(): void {
  const required = [
    'TELEGRAM_BOT_TOKEN',
    'OWNER_TELEGRAM_ID',
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(key => console.error(`   - ${key}`));
    process.exit(1);
  }
}

// Main function
async function main(): Promise<void> {
  // Validate environment
  validateEnv();

  // Initialize database
  console.log('🔧 Initializing database...');
  initializeDatabase();

  const token = process.env.TELEGRAM_BOT_TOKEN!;
  const ownerId = parseInt(process.env.OWNER_TELEGRAM_ID!, 10);

  if (isNaN(ownerId)) {
    console.error('❌ OWNER_TELEGRAM_ID must be a valid number');
    process.exit(1);
  }

  // Create bot instance
  const bot = new TelegramBot(token, { polling: true });

  console.log('🤖 Bot started successfully!');
  console.log(`👤 Owner ID: ${ownerId}`);
  if (isTestMode) {
    console.log('🧪 TEST MODE ENABLED - Using accelerated timers');
  }

  // Log all incoming messages
  bot.on('message', (msg) => {
    const userId = msg.from?.id;
    const username = msg.from?.username || msg.from?.first_name || 'Unknown';
    const text = msg.text || '[non-text message]';
    const isAuthorized = userId && AUTHORIZED_USERS.includes(userId);
    
    console.log(`\n📨 ${username} (${userId}) ${isAuthorized ? '✅' : '🚫'}: ${text}`);
  });

  // Register command handlers
  bot.onText(/\/start/, (msg) => handleStart(bot, msg, ownerId));
  bot.onText(/\/status/, (msg) => handleStatus(bot, msg, ownerId));
  
  // Training commands
  bot.onText(/\/train_c/, (msg) => handleTrainC(bot, msg, ownerId));
  bot.onText(/\/train_b/, (msg) => handleTrainB(bot, msg, ownerId));
  bot.onText(/\/train_a/, (msg) => handleTrainA(bot, msg, ownerId));
  
  // Stop commands
  bot.onText(/\/stop_c/, (msg) => handleStopC(bot, msg, ownerId));
  bot.onText(/\/stop_b/, (msg) => handleStopB(bot, msg, ownerId));
  bot.onText(/\/stop_a/, (msg) => handleStopA(bot, msg, ownerId));
  
  // Rental commands
  bot.onText(/\/rental_c/, (msg) => handleRentalC(bot, msg, ownerId));
  bot.onText(/\/rental_b/, (msg) => handleRentalB(bot, msg, ownerId));
  bot.onText(/\/rental_a/, (msg) => handleRentalA(bot, msg, ownerId));
  
  // Test mode
  bot.onText(/\/testmode/, (msg) => 
    handleTestMode(bot, msg, ownerId, () => restartScheduler(bot, ownerId))
  );

  // Register callback query handler
  bot.on('callback_query', (query) => {
    const userId = query.from.id;
    const username = query.from.username || query.from.first_name || 'Unknown';
    const data = query.data || '[no data]';
    const isAuthorized = AUTHORIZED_USERS.includes(userId);
    
    console.log(`\n🔘 ${username} (${userId}) ${isAuthorized ? '✅' : '🚫'}: ${data}`);
    
    handleCallbackQuery(bot, query, ownerId);
  });

  // Start the scheduler for checking training completion
  startScheduler(bot, ownerId);

  // Handle polling errors
  bot.on('polling_error', (error) => {
    console.error('Polling error:', error);
  });

  // Handle process termination
  process.on('SIGINT', () => {
    console.log('\n👋 Shutting down bot...');
    bot.stopPolling();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n👋 Shutting down bot...');
    bot.stopPolling();
    process.exit(0);
  });
}

// Start the bot
main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});