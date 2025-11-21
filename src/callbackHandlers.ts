/**
 * Callback query handlers for inline buttons
 */

import TelegramBot from 'node-telegram-bot-api';
import type { NpcType } from './types.js';
import { startTraining, stopTraining } from './databaseService.js';
import { formatRemainingTime, formatDate } from './timeUtils.js';
import { isTestMode, AUTHORIZED_USERS } from './types.js';

/**
 * Parse callback data in format "npc:C:reset" or "npc:B:stop"
 */
function parseCallbackData(data: string): { npcType: NpcType; action: string } | null {
  const parts = data.split(':');
  if (parts.length !== 3 || parts[0] !== 'npc') {
    return null;
  }

  const npcType = parts[1] as NpcType;
  const action = parts[2];

  if (!['C', 'B', 'A'].includes(npcType) || !['reset', 'stop'].includes(action || '')) {
    return null;
  }

  return { npcType, action: action || '' };
}

/**
 * Check if user is authorized
 */
function isAuthorized(userId: number): boolean {
  return AUTHORIZED_USERS.includes(userId);
}

/**
 * Handle callback queries from inline buttons
 */
export async function handleCallbackQuery(
  bot: TelegramBot,
  query: TelegramBot.CallbackQuery,
  ownerId: number
): Promise<void> {
  const userId = query.from.id;
  const callbackData = query.data;

  // Check authorization
  if (!isAuthorized(userId)) {
    await bot.answerCallbackQuery(query.id, {
      text: '❌ Not authorized',
      show_alert: true,
    });
    return;
  }

  if (!callbackData) {
    await bot.answerCallbackQuery(query.id);
    return;
  }

  // Parse callback data
  const parsed = parseCallbackData(callbackData);
  if (!parsed) {
    await bot.answerCallbackQuery(query.id, {
      text: '❌ Invalid callback data',
    });
    return;
  }

  const { npcType, action } = parsed;

  try {
    if (action === 'reset') {
      // Reset training (start new training cycle)
      const training = startTraining(userId, npcType);
      const remaining = formatRemainingTime(training.endIso);
      const endDate = formatDate(training.endIso);
      
      const durationText = isTestMode 
        ? `${training.durationHours * 60} minutes`
        : `${training.durationHours} hours`;

      const newMessage = `
✅ Training reset for NPC ${npcType}!

• Duration: ${durationText}
• Ends in: ${remaining}
• End time: ${endDate}

I'll remind you when it's complete! 🎉
      `.trim();

      // Edit the original message
      if (query.message) {
        await bot.editMessageText(newMessage, {
          chat_id: query.message.chat.id,
          message_id: query.message.message_id,
        });
      }

      // Answer callback query
      await bot.answerCallbackQuery(query.id, {
        text: `Training reset for NPC ${npcType}`,
      });
    } else if (action === 'stop') {
      // Stop tracking
      stopTraining(userId, npcType);

      const newMessage = `
⏹️ Tracking stopped for NPC ${npcType}

Training has been deactivated.
Use /train_${npcType.toLowerCase()} to start a new training session.
      `.trim();

      // Edit the original message
      if (query.message) {
        await bot.editMessageText(newMessage, {
          chat_id: query.message.chat.id,
          message_id: query.message.message_id,
        });
      }

      // Answer callback query
      await bot.answerCallbackQuery(query.id, {
        text: `Tracking stopped for NPC ${npcType}`,
      });
    }
  } catch (error: any) {
    console.error('Error handling callback query:', error);
    const errorMessage = error.message || 'Error processing request';
    
    // If it's a rental error, show a more helpful message
    if (errorMessage.includes('rental')) {
      await bot.answerCallbackQuery(query.id, {
        text: `❌ ${errorMessage}`,
        show_alert: true,
      });
      
      // Also edit the message to show the error
      if (query.message) {
        await bot.editMessageText(`❌ ${errorMessage}`, {
          chat_id: query.message.chat.id,
          message_id: query.message.message_id,
        });
      }
    } else {
      await bot.answerCallbackQuery(query.id, {
        text: '❌ Error processing request',
        show_alert: true,
      });
    }
  }
}

