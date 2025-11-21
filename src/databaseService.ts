/**
 * Database service using SQLite
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import type { NpcType, TrainingRow } from './types.js';
import { getTrainingDuration, getRentalDays, getTrainingCycle, isTestMode } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database path - stored in data folder
const DB_PATH = path.join(__dirname, '..', 'data', 'training.db');

let db: Database.Database | null = null;

/**
 * Get or create database connection
 */
function getDatabase(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL'); // Better performance for concurrent reads
    console.log(`✅ Connected to SQLite database at ${DB_PATH}`);
  }
  return db;
}

/**
 * Initialize database schema
 */
export function initializeDatabase(): void {
  const db = getDatabase();

  // Create trainings table with user_id
  db.exec(`
    CREATE TABLE IF NOT EXISTS trainings (
      user_id INTEGER NOT NULL,
      npc_type TEXT NOT NULL,
      start_iso TEXT,
      duration_hours REAL,
      end_iso TEXT,
      is_active INTEGER DEFAULT 0,
      last_notified_iso TEXT,
      npc_rental_start_iso TEXT,
      npc_rental_end_iso TEXT,
      rental_expiry_notified_iso TEXT,
      PRIMARY KEY (user_id, npc_type)
    )
  `);

  console.log('✅ Database schema initialized');
  
  // Run migration if needed
  migrateOldDatabase();
}

/**
 * Migrate old database (without user_id) to new schema
 */
function migrateOldDatabase(): void {
  const db = getDatabase();
  
  try {
    // Check if old table structure exists (no user_id column)
    const tableInfo = db.prepare("PRAGMA table_info(trainings)").all() as any[];
    const hasUserId = tableInfo.some((col: any) => col.name === 'user_id');
    
    if (hasUserId) {
      // Already migrated
      return;
    }
    
    console.log('🔄 Migrating old database to multi-user schema...');
    
    // Get OWNER_TELEGRAM_ID from environment
    const ownerId = parseInt(process.env.OWNER_TELEGRAM_ID || '0', 10);
    if (!ownerId) {
      console.warn('⚠️  Cannot migrate: OWNER_TELEGRAM_ID not set');
      return;
    }
    
    // Rename old table
    db.exec('ALTER TABLE trainings RENAME TO trainings_old');
    
    // Create new table with user_id
    db.exec(`
      CREATE TABLE trainings (
        user_id INTEGER NOT NULL,
        npc_type TEXT NOT NULL,
        start_iso TEXT,
        duration_hours REAL,
        end_iso TEXT,
        is_active INTEGER DEFAULT 0,
        last_notified_iso TEXT,
        npc_rental_start_iso TEXT,
        npc_rental_end_iso TEXT,
        rental_expiry_notified_iso TEXT,
        PRIMARY KEY (user_id, npc_type)
      )
    `);
    
    // Copy data from old table, assigning owner's user_id
    db.exec(`
      INSERT INTO trainings (
        user_id, npc_type, start_iso, duration_hours, end_iso,
        is_active, last_notified_iso, npc_rental_start_iso,
        npc_rental_end_iso, rental_expiry_notified_iso
      )
      SELECT 
        ${ownerId}, npc_type, start_iso, duration_hours, end_iso,
        is_active, last_notified_iso, npc_rental_start_iso,
        npc_rental_end_iso, rental_expiry_notified_iso
      FROM trainings_old
    `);
    
    // Drop old table
    db.exec('DROP TABLE trainings_old');
    
    console.log(`✅ Migration complete! Old data assigned to user ${ownerId}`);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    // If migration fails, the database will be in old format
    // User will need to manually delete training.db and restart
  }
}

/**
 * Convert database row to TrainingRow
 */
function dbRowToTrainingRow(row: any): TrainingRow {
  return {
    userId: row.user_id,
    npcType: row.npc_type as NpcType,
    startIso: row.start_iso || '',
    durationHours: row.duration_hours || 0,
    endIso: row.end_iso || '',
    isActive: row.is_active === 1,
    lastNotifiedIso: row.last_notified_iso || '',
    npcRentalStartIso: row.npc_rental_start_iso || '',
    npcRentalEndIso: row.npc_rental_end_iso || '',
    rentalExpiryNotifiedIso: row.rental_expiry_notified_iso || '',
  };
}

/**
 * Get all training rows (for all users)
 */
export function getAllTrainings(): TrainingRow[] {
  const db = getDatabase();
  const rows = db.prepare('SELECT * FROM trainings ORDER BY user_id, npc_type').all();
  return rows.map(dbRowToTrainingRow);
}

/**
 * Get all trainings for a specific user
 */
export function getUserTrainings(userId: number): TrainingRow[] {
  const db = getDatabase();
  const rows = db.prepare('SELECT * FROM trainings WHERE user_id = ? ORDER BY npc_type').all(userId);
  return rows.map(dbRowToTrainingRow);
}

/**
 * Get training by user ID and NPC type
 */
export function getTraining(userId: number, npcType: NpcType): TrainingRow | null {
  const db = getDatabase();
  const row = db.prepare('SELECT * FROM trainings WHERE user_id = ? AND npc_type = ?').get(userId, npcType);
  return row ? dbRowToTrainingRow(row) : null;
}

/**
 * Initialize default rows for C, B, A for a specific user if they don't exist
 */
export function initializeDefaultRows(userId: number): void {
  const db = getDatabase();
  const npcTypes: NpcType[] = ['C', 'B', 'A'];

  const insert = db.prepare(`
    INSERT OR IGNORE INTO trainings (user_id, npc_type, is_active)
    VALUES (?, ?, 0)
  `);

  const insertMany = db.transaction((id: number, types: NpcType[]) => {
    for (const type of types) {
      insert.run(id, type);
    }
  });

  insertMany(userId, npcTypes);
  console.log(`   ✅ Initialized 3 NPCs for user ${userId}`);
}

/**
 * Check if NPC rental is active
 */
export function isNpcRentalActive(training: TrainingRow): boolean {
  if (!training.npcRentalStartIso || !training.npcRentalEndIso) {
    return false;
  }

  const now = new Date();
  const rentalEnd = new Date(training.npcRentalEndIso);
  return now < rentalEnd;
}

/**
 * Start or update training for an NPC
 */
export function startTraining(userId: number, npcType: NpcType): TrainingRow {
  const db = getDatabase();
  const training = getTraining(userId, npcType);

  if (!training) {
    throw new Error(`Training row for NPC ${npcType} not found. Run /start first.`);
  }

  // Check if NPC rental is active
  if (!isNpcRentalActive(training)) {
    throw new Error('NPC_RENTAL_EXPIRED');
  }

  const now = new Date();
  const durationHours = getTrainingDuration(npcType);
  const endTime = new Date(now.getTime() + durationHours * 60 * 60 * 1000);

  // Check if at least one training cycle can complete before rental expires
  const rentalEnd = new Date(training.npcRentalEndIso);
  const cycleHours = getTrainingCycle(npcType);
  const timeUntilRentalExpiry = (rentalEnd.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (timeUntilRentalExpiry < cycleHours) {
    throw new Error('INSUFFICIENT_RENTAL_TIME');
  }

  // Log warning if training will be interrupted
  if (timeUntilRentalExpiry < durationHours) {
    const completableCycles = Math.floor(timeUntilRentalExpiry / cycleHours);
    const progressPerCycle = npcType === 'C' ? 4 : npcType === 'B' ? 4 : 2;
    const estimatedProgress = completableCycles * progressPerCycle;
    console.log(
      `⚠️ Warning: Training for NPC ${npcType} will be interrupted by rental expiry. ` +
      `Estimated progress: ${estimatedProgress}%`
    );
  }

  db.prepare(`
    UPDATE trainings
    SET start_iso = ?,
        duration_hours = ?,
        end_iso = ?,
        is_active = 1,
        last_notified_iso = NULL
    WHERE user_id = ? AND npc_type = ?
  `).run(now.toISOString(), durationHours, endTime.toISOString(), userId, npcType);

  console.log(`   ✅ Training started: NPC ${npcType}`);
  
  // Return updated training
  const updatedTraining = getTraining(userId, npcType);
  if (!updatedTraining) {
    throw new Error(`Failed to retrieve updated training for NPC ${npcType}`);
  }
  return updatedTraining;
}

/**
 * Stop training for an NPC
 */
export function stopTraining(userId: number, npcType: NpcType): void {
  const db = getDatabase();
  
  db.prepare(`
    UPDATE trainings
    SET is_active = 0
    WHERE user_id = ? AND npc_type = ?
  `).run(userId, npcType);

  console.log(`   ⏹️  Training stopped: NPC ${npcType}`);
}

/**
 * Mark training as notified
 */
export function markAsNotified(userId: number, npcType: NpcType): void {
  const db = getDatabase();
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE trainings
    SET last_notified_iso = ?
    WHERE user_id = ? AND npc_type = ?
  `).run(now, userId, npcType);
}

/**
 * Set NPC rental period
 */
export function setNpcRental(userId: number, npcType: NpcType): TrainingRow {
  const db = getDatabase();
  const now = new Date();
  const rentalDays = getRentalDays();
  const endTime = new Date(now.getTime() + rentalDays * 24 * 60 * 60 * 1000);

  db.prepare(`
    UPDATE trainings
    SET npc_rental_start_iso = ?,
        npc_rental_end_iso = ?,
        rental_expiry_notified_iso = NULL
    WHERE user_id = ? AND npc_type = ?
  `).run(now.toISOString(), endTime.toISOString(), userId, npcType);

  const daysText = isTestMode ? '30 minutes' : '15 days';
  console.log(`   🏠 Rental set: NPC ${npcType} (${daysText})`);
  
  // Return updated training
  const updatedTraining = getTraining(userId, npcType);
  if (!updatedTraining) {
    throw new Error(`Failed to retrieve updated training for NPC ${npcType}`);
  }
  return updatedTraining;
}

/**
 * Mark rental expiry as notified
 */
export function markRentalExpiryNotified(userId: number, npcType: NpcType): void {
  const db = getDatabase();
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE trainings
    SET rental_expiry_notified_iso = ?
    WHERE user_id = ? AND npc_type = ?
  `).run(now, userId, npcType);
}

/**
 * Close database connection (for cleanup)
 */
export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
    console.log('✅ Database connection closed');
  }
}

