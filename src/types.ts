/**
 * Types and constants for the Pet Training Bot
 */

export type NpcType = 'C' | 'B' | 'A';

/**
 * List of authorized user IDs
 */
export const AUTHORIZED_USERS = [
  7172542482,  // Luc (owner)
  7860400654,  // Authorized user
];

export interface TrainingRow {
  userId: number;
  npcType: NpcType;
  startIso: string;
  durationHours: number;
  endIso: string;
  isActive: boolean;
  lastNotifiedIso: string;
  npcRentalStartIso: string;
  npcRentalEndIso: string;
  rentalExpiryNotifiedIso: string;
}

/**
 * Test mode flag - automatically set from environment variable
 * Test mode is disabled in production environments
 */
const isProduction = process.env.NODE_ENV === 'production';
export let isTestMode = !isProduction && process.env.TEST_MODE === 'true';

/**
 * Enable or disable test mode
 * Test mode cannot be enabled in production
 */
export function setTestMode(enabled: boolean): void {
  if (isProduction && enabled) {
    console.log('⚠️  Test mode cannot be enabled in production environment');
    return;
  }
  isTestMode = enabled;
  console.log(`🧪 Test mode ${enabled ? 'ENABLED' : 'DISABLED'}`);
}

/**
 * Training duration constants (in hours)
 * In test mode: C=1min, B=2min, A=3min
 */
export const TRAINING_DURATIONS: Record<NpcType, number> = {
  C: 50,
  B: 75,
  A: 250,
};

/**
 * Training cycle intervals (hours between each % gain)
 */
export const TRAINING_CYCLES: Record<NpcType, number> = {
  C: 2,  // 4% every 2 hours
  B: 3,  // 4% every 3 hours
  A: 5,  // 2% every 5 hours
};

/**
 * Get training duration based on mode
 */
export function getTrainingDuration(npcType: NpcType): number {
  if (isTestMode) {
    // Test mode: minutes instead of hours
    return {
      C: 1 / 60, // 1 minute
      B: 2 / 60, // 2 minutes
      A: 3 / 60, // 3 minutes
    }[npcType];
  }
  return TRAINING_DURATIONS[npcType];
}

/**
 * Get training cycle interval based on mode
 */
export function getTrainingCycle(npcType: NpcType): number {
  if (isTestMode) {
    // Test mode: proportional to training duration
    return {
      C: (1 / 60) / 25, // 1 minute total / 25 cycles = 2.4 seconds per cycle
      B: (2 / 60) / 25, // 2 minutes total / 25 cycles = 4.8 seconds per cycle
      A: (3 / 60) / 50, // 3 minutes total / 50 cycles = 3.6 seconds per cycle
    }[npcType];
  }
  return TRAINING_CYCLES[npcType];
}

/**
 * NPC rental duration in days
 * In test mode: 5 minutes
 */
export const NPC_RENTAL_DAYS = 15;

export function getRentalDays(): number {
  if (isTestMode) {
    return 5 / (24 * 60); // 5 minutes in days
  }
  return NPC_RENTAL_DAYS;
}

/**
 * Hours before rental expiry to send warning
 * In test mode: 1 minute
 */
export function getRentalWarningTime(): number {
  if (isTestMode) {
    return 1 / 60; // 1 minute in hours
  }
  return 24; // 24 hours (1 day) before expiry
}

/**
 * Scheduler check interval in milliseconds
 * Normal: 2 minutes, Test mode: 10 seconds
 */
export function getSchedulerInterval(): number {
  if (isTestMode) {
    return 10 * 1000; // 10 seconds
  }
  return 2 * 60 * 1000; // 2 minutes
}

export const SCHEDULER_INTERVAL_MS = 2 * 60 * 1000;

/**
 * Column headers for the Google Sheet
 */
export const SHEET_HEADERS = [
  'npc_type',
  'start_iso',
  'duration_hours',
  'end_iso',
  'is_active',
  'last_notified_iso',
  'npc_rental_start_iso',
  'npc_rental_end_iso',
  'rental_expiry_notified_iso',
];

/**
 * Sheet tab name
 */
export const SHEET_TAB_NAME = 'training';

