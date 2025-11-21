/**
 * Scheduler service for checking training completion and sending reminders
 */

import TelegramBot from 'node-telegram-bot-api';
import { getAllTrainings, markAsNotified, isNpcRentalActive, stopTraining, markRentalExpiryNotified } from './databaseService.js';
import { isTrainingFinished } from './timeUtils.js';
import type { NpcType } from './types.js';
import { getSchedulerInterval, isTestMode, getRentalWarningTime } from './types.js';

let schedulerInterval: NodeJS.Timeout | null = null;

/**
 * Send message to a specific user
 */
async function sendToUser(
  bot: TelegramBot,
  userId: number,
  message: string,
  options?: TelegramBot.SendMessageOptions
): Promise<void> {
  try {
    await bot.sendMessage(userId, message, options);
  } catch (error) {
    console.error(`Failed to send message to user ${userId}:`, error);
  }
}

/**
 * Create inline keyboard for training reminder
 */
function createReminderKeyboard(npcType: NpcType): TelegramBot.InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        {
          text: '🔄 Reset training',
          callback_data: `npc:${npcType}:reset`,
        },
        {
          text: '⏹️ Stop tracking',
          callback_data: `npc:${npcType}:stop`,
        },
      ],
    ],
  };
}

/**
 * Check all trainings and send reminders if needed
 */
async function checkTrainings(bot: TelegramBot, ownerId: number): Promise<void> {
  try {
    const trainings = await getAllTrainings();

    // Skip if no trainings exist (users need to run /start individually)
    if (trainings.length === 0) {
      return;
    }

    for (const training of trainings) {
      // Check if rental is about to expire and send warning
      if (training.npcRentalEndIso && !training.rentalExpiryNotifiedIso) {
        const now = new Date();
        const rentalEnd = new Date(training.npcRentalEndIso);
        const hoursUntilExpiry = (rentalEnd.getTime() - now.getTime()) / (1000 * 60 * 60);
        const warningTime = getRentalWarningTime();
        
        // Send warning if within warning time but not expired yet
        if (hoursUntilExpiry > 0 && hoursUntilExpiry <= warningTime) {
          console.log(`User ${training.userId} - NPC ${training.npcType} rental expiring soon - sending warning`);
          
          const timeText = isTestMode 
            ? `${Math.round(hoursUntilExpiry * 60)} seconds`
            : hoursUntilExpiry < 1 
              ? `${Math.round(hoursUntilExpiry * 60)} minutes`
              : `${Math.round(hoursUntilExpiry)} hours`;
          
          await sendToUser(
            bot,
            training.userId,
            `⚠️ NPC ${training.npcType} rental expiring soon!\n\n` +
            `Time remaining: ${timeText}\n\n` +
            `Use /rental_${training.npcType.toLowerCase()} to renew before it expires.`
          );
          
          await markRentalExpiryNotified(training.userId, training.npcType);
        }
      }
      
      // Skip if not active
      if (!training.isActive) {
        continue;
      }

      // Check if rental has expired - pause training if so
      if (!isNpcRentalActive(training)) {
        console.log(`User ${training.userId} - NPC ${training.npcType} rental expired - pausing training`);
        stopTraining(training.userId, training.npcType);
        
        await sendToUser(
          bot,
          training.userId,
          `⏸️ Training paused for NPC ${training.npcType}\n\n` +
          `Reason: NPC rental has expired.\n` +
          `Use /rental_${training.npcType.toLowerCase()} to renew the rental.`
        );
        continue;
      }

      // Skip if no end time set
      if (!training.endIso) {
        continue;
      }

      // Check if training is finished
      if (!isTrainingFinished(training.endIso)) {
        continue;
      }

      // Check if already notified
      if (training.lastNotifiedIso) {
        continue;
      }

      // Send reminder
      const message = `🎉 Training finished for NPC ${training.npcType}!\n\nWhat would you like to do?`;

      await sendToUser(bot, training.userId, message, {
        reply_markup: createReminderKeyboard(training.npcType),
      });

      // Mark as notified
      markAsNotified(training.userId, training.npcType);
      console.log(`Sent reminder to user ${training.userId} for NPC ${training.npcType}`);
    }
  } catch (error) {
    console.error('Error checking trainings:', error);
  }
}

/**
 * Start the scheduler
 */
export function startScheduler(bot: TelegramBot, ownerId: number): void {
  if (schedulerInterval) {
    console.log('Scheduler already running');
    return;
  }

  const interval = getSchedulerInterval();
  const mode = isTestMode ? '🧪 TEST MODE' : 'NORMAL';
  console.log(`Starting scheduler [${mode}] (checking every ${interval / 1000}s)`);

  // Run immediately on start
  checkTrainings(bot, ownerId).catch(console.error);

  // Then run periodically
  schedulerInterval = setInterval(() => {
    checkTrainings(bot, ownerId).catch(console.error);
  }, interval);
}

/**
 * Restart the scheduler (useful when switching modes)
 */
export function restartScheduler(bot: TelegramBot, ownerId: number): void {
  stopScheduler();
  startScheduler(bot, ownerId);
}

/**
 * Stop the scheduler
 */
export function stopScheduler(): void {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log('Scheduler stopped');
  }
}

