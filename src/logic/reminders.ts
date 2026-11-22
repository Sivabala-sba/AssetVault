import { parseISO, isValid, subDays } from 'date-fns';
import type { Reminder } from '../types/models';

/**
 * Returns the next alert date for a reminder based on alertOffsetsDays.
 * Picks the latest offset that hasn't yet passed.
 */
export function getNextAlertDate(reminder: Reminder): Date | null {
  const due = parseISO(reminder.dueDate);
  if (!isValid(due)) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Sort offsets descending so we try the furthest out first
  const sortedOffsets = [...reminder.alertOffsetsDays].sort((a, b) => b - a);

  for (const offset of sortedOffsets) {
    const alertDate = subDays(due, offset);
    if (alertDate >= today) {
      return alertDate;
    }
  }

  // If all offsets have passed, alert on the due date itself
  return due >= today ? due : null;
}

/**
 * Returns true if the reminder needs to fire today (based on alertOffsets and dueDate).
 */
export function shouldAlertToday(reminder: Reminder): boolean {
  const alertDate = getNextAlertDate(reminder);
  if (!alertDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const alert = new Date(alertDate);
  alert.setHours(0, 0, 0, 0);
  return alert.getTime() === today.getTime();
}
