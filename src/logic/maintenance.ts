import { addMonths, parseISO, isValid } from 'date-fns';
import type { MaintenanceTask } from '../types/models';

/**
 * Calculates the next due date for a maintenance task given its frequency.
 * If lastDoneDate is not set, uses today as the baseline.
 */
export function calcNextDueDate(frequencyMonths: number, lastDoneDate?: string | null): string {
  const baseline = lastDoneDate && isValid(parseISO(lastDoneDate))
    ? parseISO(lastDoneDate)
    : new Date();
  return addMonths(baseline, frequencyMonths).toISOString();
}

/**
 * Returns whether a maintenance task is overdue (nextDueDate is in the past).
 */
export function isMaintenanceOverdue(task: MaintenanceTask): boolean {
  const due = parseISO(task.nextDueDate);
  if (!isValid(due)) return false;
  return due < new Date();
}

/**
 * Returns days until a maintenance task is due (negative = overdue).
 */
export function daysUntilMaintenance(task: MaintenanceTask): number {
  const due = parseISO(task.nextDueDate);
  if (!isValid(due)) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}
