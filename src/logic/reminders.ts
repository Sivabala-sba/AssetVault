import {
  parseISO,
  isValid,
  subDays,
  addMonths,
  addYears,
  format,
  startOfDay,
  isBefore,
} from 'date-fns';
import type { Asset, Reminder } from '../types/models';
import { getWarrantyInfo } from './warranty';

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

/**
 * Calculates the next occurrence date for recurring reminders.
 * Returns { dueDate: 'YYYY-MM-DD' } or null if not recurring.
 */
export function calculateNextOccurrence(
  reminder: Reminder
): { dueDate: string } | null {
  if (!reminder.repeatFrequency || reminder.repeatFrequency === 'none') {
    return null;
  }

  const due = parseISO(reminder.dueDate);
  if (!isValid(due)) return null;

  let nextDate: Date;
  if (reminder.repeatFrequency === 'monthly') {
    nextDate = addMonths(due, 1);
  } else if (reminder.repeatFrequency === 'yearly') {
    nextDate = addYears(due, 1);
  } else {
    return null;
  }

  return { dueDate: format(nextDate, 'yyyy-MM-dd') };
}

/**
 * Categorizes reminders into four segments:
 * Upcoming, Overdue, Snoozed, Completed.
 */
export function categorizeReminders(
  reminders: Reminder[],
  referenceDate: Date = new Date()
): {
  upcoming: Reminder[];
  overdue: Reminder[];
  snoozed: Reminder[];
  completed: Reminder[];
} {
  const today = startOfDay(referenceDate);

  const upcoming: Reminder[] = [];
  const overdue: Reminder[] = [];
  const snoozed: Reminder[] = [];
  const completed: Reminder[] = [];

  for (const reminder of reminders) {
    if (reminder.status === 'completed') {
      completed.push(reminder);
      continue;
    }

    if (reminder.status === 'snoozed') {
      snoozed.push(reminder);
      continue;
    }

    // Default status: upcoming (or skipped)
    const dueDate = parseISO(reminder.dueDate);
    if (isValid(dueDate) && isBefore(startOfDay(dueDate), today)) {
      overdue.push(reminder);
    } else {
      upcoming.push(reminder);
    }
  }

  return { upcoming, overdue, snoozed, completed };
}

/**
 * Calculates exact fire Dates for all configured alert offsets plus notification time.
 */
export function calculateAlertDates(
  dueDateStr: string,
  alertOffsetsDays: number[],
  notificationTime: string = '09:00'
): Date[] {
  const due = parseISO(dueDateStr);
  if (!isValid(due)) return [];

  const [hoursStr, minutesStr] = (notificationTime || '09:00').split(':');
  const hours = parseInt(hoursStr || '9', 10);
  const minutes = parseInt(minutesStr || '0', 10);

  const dates: Date[] = [];
  const uniqueOffsets = Array.from(new Set(alertOffsetsDays)).sort((a, b) => b - a);

  for (const offset of uniqueOffsets) {
    const alertDate = subDays(due, offset);
    alertDate.setHours(hours, minutes, 0, 0);
    dates.push(alertDate);
  }

  return dates;
}

/**
 * Creates a warranty expiry reminder suggestion if the asset has a valid expiry
 * date and doesn't already have an active/existing warranty expiry reminder.
 */
export function createWarrantyExpiryReminderSuggestion(
  asset: Asset,
  existingReminders: Reminder[] = []
): Omit<Reminder, 'id'> | null {
  const warrantyInfo = getWarrantyInfo(asset);
  if (!warrantyInfo.endDate || warrantyInfo.needsConfirmation) {
    return null;
  }

  // Check if a warrantyExpiry reminder already exists for this asset
  const alreadyExists = existingReminders.some(
    (r) => r.assetId === asset.id && r.type === 'warrantyExpiry'
  );

  if (alreadyExists) {
    return null;
  }

  return {
    assetId: asset.id,
    title: `${asset.name} - Warranty Expiry`,
    type: 'warrantyExpiry',
    dueDate: warrantyInfo.endDate,
    alertOffsetsDays: [60, 30, 14, 3],
    repeatFrequency: 'none',
    status: 'upcoming',
    notificationTime: '09:00',
  };
}
