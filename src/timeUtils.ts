/**
 * Time utility functions
 */

/**
 * Calculate end time from start time and duration
 */
export function calculateEndTime(startIso: string, durationHours: number): string {
  const start = new Date(startIso);
  const end = new Date(start.getTime() + durationHours * 60 * 60 * 1000);
  return end.toISOString();
}

/**
 * Format remaining time in a human-readable way
 * Returns format like "2d 5h 30m" or "12h 34m" or "45m"
 */
export function formatRemainingTime(endIso: string): string {
  const now = new Date();
  const end = new Date(endIso);
  const diffMs = end.getTime() - now.getTime();

  if (diffMs <= 0) {
    return 'finished';
  }

  const totalMinutes = Math.floor(diffMs / (60 * 1000));
  const totalHours = Math.floor(totalMinutes / 60);
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  const minutes = totalMinutes % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0 || parts.length === 0) parts.push(`${minutes}m`);

  return parts.join(' ');
}

/**
 * Format date in a readable way
 */
export function formatDate(isoString: string): string {
  if (!isoString) return 'N/A';
  const date = new Date(isoString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/**
 * Check if training has finished
 */
export function isTrainingFinished(endIso: string): boolean {
  const now = new Date();
  const end = new Date(endIso);
  return now >= end;
}

/**
 * Get current time in ISO format
 */
export function getCurrentIso(): string {
  return new Date().toISOString();
}

/**
 * Add days to a date
 */
export function addDays(isoString: string, days: number): string {
  const date = new Date(isoString);
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

