/**
 * Bot command handlers
 */

import TelegramBot from 'node-telegram-bot-api';
import type { NpcType } from './types.js';
import { TRAINING_DURATIONS, NPC_RENTAL_DAYS, setTestMode, isTestMode, getTrainingDuration, getRentalDays, getTrainingCycle, AUTHORIZED_USERS } from './types.js';
import {
  initializeDefaultRows,
  startTraining,
  stopTraining,
  getUserTrainings,
  setNpcRental,
  isNpcRentalActive,
} from './databaseService.js';
import { formatRemainingTime, formatDate } from './timeUtils.js';

/**
 * Check if user is authorized
 */
function isAuthorized(userId: number, ownerId: number): boolean {
  return AUTHORIZED_USERS.includes(userId);
}

/**
 * Handle /start command
 */
export async function handleStart(
  bot: TelegramBot,
  msg: TelegramBot.Message,
  ownerId: number
): Promise<void> {
  const chatId = msg.chat.id;
  const userId = msg.from?.id;

  if (!userId || !isAuthorized(userId, ownerId)) {
    await bot.sendMessage(
      chatId,
      '❌ Sorry, you are not authorized to use this bot.'
    );
    return;
  }

  // Initialize default rows for this user if needed
  initializeDefaultRows(userId);

  const mode = isTestMode ? '\n🧪 TEST MODE ACTIVE - Accelerated timers for testing\n' : '';
  
  const welcomeMessage = `
🎮 Welcome to Pet Training Bot!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${mode}
👋 Hello! I'll help you manage your NPC pet trainers and send you reminders when training completes.

📊 YOUR NPCs
Each NPC type trains different pet levels:
• NPC C → Trains C-level pets (50 hours)
• NPC B → Trains B-level pets (75 hours)  
• NPC A → Trains A-level pets (250 hours)

🏠 RENTAL SYSTEM
• Cost: 140 FCOINS per NPC
• Duration: ${NPC_RENTAL_DAYS} days
• You must rent an NPC before training!

⚡ QUICK START
1️⃣ Rent an NPC: /rental_c
2️⃣ Start training: /train_c
3️⃣ Wait for notification! 🔔

📝 COMMANDS

Training:
/train_c /train_b /train_a - Start training
/stop_c /stop_b /stop_a - Stop training

Rental:
/rental_c /rental_b /rental_a - Rent NPC (${NPC_RENTAL_DAYS} days)

Info:
/status - View all your trainings
/testmode - Toggle test mode
/start - Show this message

💡 TIP: I'll automatically pause training if your NPC rental expires!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Ready to train some pets? 🐾
  `.trim();

  await bot.sendMessage(chatId, welcomeMessage);
}

/**
 * Handle /status command
 */
export async function handleStatus(
  bot: TelegramBot,
  msg: TelegramBot.Message,
  ownerId: number
): Promise<void> {
  const chatId = msg.chat.id;
  const userId = msg.from?.id;

  if (!userId || !isAuthorized(userId, ownerId)) {
    await bot.sendMessage(chatId, '❌ Not authorized.');
    return;
  }

  const trainings = getUserTrainings(userId);

  if (trainings.length === 0) {
    await bot.sendMessage(chatId, '📋 No training data found. Use /start to initialize.');
    return;
  }

  let statusMessage = '📊 Training Status\n\n';

  for (const training of trainings) {
    const rentalActive = isNpcRentalActive(training);
    const rentalIcon = rentalActive ? '✅' : '❌';
    
    statusMessage += `NPC ${training.npcType}:\n`;
    statusMessage += `• Rental: ${rentalIcon} ${rentalActive ? 'Active' : 'Expired/Not set'}\n`;
    
    if (training.npcRentalEndIso) {
      const rentalEnd = formatDate(training.npcRentalEndIso);
      const rentalRemaining = formatRemainingTime(training.npcRentalEndIso);
      if (rentalActive) {
        statusMessage += `• Rental expires in: ${rentalRemaining}\n`;
        
        // Check if there's enough time for at least one training cycle
        const now = new Date();
        const rentalEndDate = new Date(training.npcRentalEndIso);
        const hoursRemaining = (rentalEndDate.getTime() - now.getTime()) / (1000 * 60 * 60);
        const cycleInterval = getTrainingCycle(training.npcType);
        
        if (!training.isActive) {
          if (hoursRemaining < cycleInterval) {
            statusMessage += `⚠️ Not enough time for training (needs ${cycleInterval}h minimum)\n`;
          } else {
            const trainingDuration = getTrainingDuration(training.npcType);
            if (hoursRemaining < trainingDuration) {
              const cyclesCompleted = Math.floor(hoursRemaining / cycleInterval);
              const percentGained = training.npcType === 'A' ? cyclesCompleted * 2 : cyclesCompleted * 4;
              statusMessage += `ℹ️ Can gain ${percentGained}% (${cyclesCompleted} cycles) before expiry\n`;
            }
          }
        }
      } else {
        statusMessage += `• Rental expired: ${rentalEnd}\n`;
      }
    }
    
    statusMessage += `• Training: ${training.isActive ? 'Active' : 'Inactive'}\n`;

    if (training.isActive && training.endIso) {
      const remaining = formatRemainingTime(training.endIso);
      const endDate = formatDate(training.endIso);
      statusMessage += `• Training ends in: ${remaining}\n`;
      statusMessage += `• Training end time: ${endDate}\n`;
    }

    statusMessage += '\n';
  }

  await bot.sendMessage(chatId, statusMessage);
}

/**
 * Generic handler for starting training
 */
async function handleTrainNpc(
  bot: TelegramBot,
  msg: TelegramBot.Message,
  ownerId: number,
  npcType: NpcType
): Promise<void> {
  const chatId = msg.chat.id;
  const userId = msg.from?.id;

  if (!userId || !isAuthorized(userId, ownerId)) {
    await bot.sendMessage(chatId, '❌ Not authorized.');
    return;
  }

  try {
    const training = startTraining(userId, npcType);
    const remaining = formatRemainingTime(training.endIso);
    const endDate = formatDate(training.endIso);
    
    const durationText = isTestMode 
      ? `${training.durationHours * 60} minutes`
      : `${training.durationHours} hours`;

    let message = `✅ Training started for NPC ${npcType}!\n\n`;
    message += `• Duration: ${durationText}\n`;
    message += `• Ends in: ${remaining}\n`;
    message += `• End time: ${endDate}\n`;
    
    // Check if rental expires before training completes
    if (training.npcRentalEndIso) {
      const trainingEnd = new Date(training.endIso);
      const rentalEnd = new Date(training.npcRentalEndIso);
      
      if (trainingEnd > rentalEnd) {
        const now = new Date();
        const hoursRemaining = (rentalEnd.getTime() - now.getTime()) / (1000 * 60 * 60);
        const cycleInterval = getTrainingCycle(npcType);
        const cyclesCompleted = Math.floor(hoursRemaining / cycleInterval);
        const percentGained = npcType === 'A' ? cyclesCompleted * 2 : cyclesCompleted * 4;
        
        message += `\n⚠️ Note: NPC rental expires before training completes.\n`;
        message += `You will gain approximately ${percentGained}% (${cyclesCompleted} cycles) before expiration.\n`;
      }
    }
    
    message += `\nI'll remind you when training is complete! 🎉`;

    await bot.sendMessage(chatId, message);
  } catch (error: any) {
    console.error('Error starting training:', error);
    const errorMessage = error.message || 'Error starting training. Please try again.';
    await bot.sendMessage(chatId, `❌ ${errorMessage}`);
  }
}

/**
 * Generic handler for stopping training
 */
async function handleStopNpc(
  bot: TelegramBot,
  msg: TelegramBot.Message,
  ownerId: number,
  npcType: NpcType
): Promise<void> {
  const chatId = msg.chat.id;
  const userId = msg.from?.id;

  if (!userId || !isAuthorized(userId, ownerId)) {
    await bot.sendMessage(chatId, '❌ Not authorized.');
    return;
  }

  try {
    stopTraining(userId, npcType);
    await bot.sendMessage(chatId, `✅ Training stopped for NPC ${npcType}.`);
  } catch (error) {
    console.error('Error stopping training:', error);
    await bot.sendMessage(chatId, '❌ Error stopping training. Please try again.');
  }
}

/**
 * Generic handler for setting NPC rental
 */
async function handleRentalNpc(
  bot: TelegramBot,
  msg: TelegramBot.Message,
  ownerId: number,
  npcType: NpcType
): Promise<void> {
  const chatId = msg.chat.id;
  const userId = msg.from?.id;

  if (!userId || !isAuthorized(userId, ownerId)) {
    await bot.sendMessage(chatId, '❌ Not authorized.');
    return;
  }

  try {
    const training = setNpcRental(userId, npcType);
    const endDate = formatDate(training.npcRentalEndIso);

    const message = `
✅ NPC ${npcType} rental set!

• Rental period: ${NPC_RENTAL_DAYS} days
• Expires: ${endDate}
• Cost: 140 FCOINS

Make sure to renew before expiry! ⏰
    `.trim();

    await bot.sendMessage(chatId, message);
  } catch (error) {
    console.error('Error setting NPC rental:', error);
    await bot.sendMessage(chatId, '❌ Error setting NPC rental. Please try again.');
  }
}

// Export individual command handlers
export const handleTrainC = (bot: TelegramBot, msg: TelegramBot.Message, ownerId: number) =>
  handleTrainNpc(bot, msg, ownerId, 'C');
export const handleTrainB = (bot: TelegramBot, msg: TelegramBot.Message, ownerId: number) =>
  handleTrainNpc(bot, msg, ownerId, 'B');
export const handleTrainA = (bot: TelegramBot, msg: TelegramBot.Message, ownerId: number) =>
  handleTrainNpc(bot, msg, ownerId, 'A');

export const handleStopC = (bot: TelegramBot, msg: TelegramBot.Message, ownerId: number) =>
  handleStopNpc(bot, msg, ownerId, 'C');
export const handleStopB = (bot: TelegramBot, msg: TelegramBot.Message, ownerId: number) =>
  handleStopNpc(bot, msg, ownerId, 'B');
export const handleStopA = (bot: TelegramBot, msg: TelegramBot.Message, ownerId: number) =>
  handleStopNpc(bot, msg, ownerId, 'A');

export const handleRentalC = (bot: TelegramBot, msg: TelegramBot.Message, ownerId: number) =>
  handleRentalNpc(bot, msg, ownerId, 'C');
export const handleRentalB = (bot: TelegramBot, msg: TelegramBot.Message, ownerId: number) =>
  handleRentalNpc(bot, msg, ownerId, 'B');
export const handleRentalA = (bot: TelegramBot, msg: TelegramBot.Message, ownerId: number) =>
  handleRentalNpc(bot, msg, ownerId, 'A');

/**
 * Handle /testmode command
 */
export async function handleTestMode(
  bot: TelegramBot,
  msg: TelegramBot.Message,
  ownerId: number,
  restartSchedulerFn: () => void
): Promise<void> {
  const chatId = msg.chat.id;
  const userId = msg.from?.id;

  if (!userId || !isAuthorized(userId, ownerId)) {
    await bot.sendMessage(chatId, '❌ Not authorized.');
    return;
  }

  // Toggle test mode
  const newMode = !isTestMode;
  setTestMode(newMode);

  // Restart scheduler with new interval
  restartSchedulerFn();

  const message = newMode
    ? `
🧪 TEST MODE ENABLED

Training durations:
• NPC C: 1 minute
• NPC B: 2 minutes
• NPC A: 3 minutes

Scheduler: checks every 10 seconds
Rental: 5 minutes

Perfect for testing reminders locally!
Use /testmode again to disable.
    `.trim()
    : `
✅ TEST MODE DISABLED

Back to normal durations:
• NPC C: ${TRAINING_DURATIONS.C} hours
• NPC B: ${TRAINING_DURATIONS.B} hours
• NPC A: ${TRAINING_DURATIONS.A} hours

Scheduler: checks every 2 minutes
Rental: ${NPC_RENTAL_DAYS} days
    `.trim();

  await bot.sendMessage(chatId, message);
}
