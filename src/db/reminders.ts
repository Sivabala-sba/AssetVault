import { getDb } from './client';
import type { Reminder } from '../types/models';

function parseJson<T>(json: string | null | undefined, fallback: T): T {
  if (!json) return fallback;
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

function rowToReminder(r: Record<string, unknown>): Reminder {
  return {
    id: r.id as string,
    assetId: r.assetId as string,
    title: r.title as string,
    type: r.type as Reminder['type'],
    dueDate: r.dueDate as string,
    alertOffsetsDays: Array.isArray(r.alertOffsetsDays)
      ? (r.alertOffsetsDays as number[])
      : parseJson<number[]>(r.alertOffsetsDays as string, [60, 30, 14, 3]),
    repeatFrequency: (r.repeatFrequency as Reminder['repeatFrequency']) || undefined,
    status: (r.status as Reminder['status']) || 'upcoming',
    snoozedUntil: (r.snoozedUntil as string | undefined) || undefined,
    notificationTime: (r.notificationTime as string) || '09:00',
  };
}

export const reminderRepository = {
  async getAll(): Promise<Reminder[]> {
    const db = getDb();
    const rows = await db.getAllAsync<Record<string, unknown>>(
      'SELECT * FROM reminders ORDER BY dueDate ASC'
    );
    return rows.map(rowToReminder);
  },

  async getForAsset(assetId: string): Promise<Reminder[]> {
    const db = getDb();
    const rows = await db.getAllAsync<Record<string, unknown>>(
      'SELECT * FROM reminders WHERE assetId = ? ORDER BY dueDate ASC',
      [assetId]
    );
    return rows.map(rowToReminder);
  },

  async getById(id: string): Promise<Reminder | null> {
    const db = getDb();
    const row = await db.getFirstAsync<Record<string, unknown>>(
      'SELECT * FROM reminders WHERE id = ?',
      [id]
    );
    return row ? rowToReminder(row) : null;
  },

  async insert(reminder: Reminder): Promise<void> {
    const db = getDb();
    await db.runAsync(
      `INSERT INTO reminders (
        id, assetId, title, type, dueDate, alertOffsetsDays,
        repeatFrequency, status, snoozedUntil, notificationTime
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        reminder.id,
        reminder.assetId,
        reminder.title,
        reminder.type,
        reminder.dueDate,
        JSON.stringify(reminder.alertOffsetsDays || [60, 30, 14, 3]),
        reminder.repeatFrequency || null,
        reminder.status || 'upcoming',
        reminder.snoozedUntil || null,
        reminder.notificationTime || '09:00',
      ]
    );
  },

  async update(reminder: Reminder): Promise<void> {
    const db = getDb();
    await db.runAsync(
      `UPDATE reminders SET
        assetId = ?,
        title = ?,
        type = ?,
        dueDate = ?,
        alertOffsetsDays = ?,
        repeatFrequency = ?,
        status = ?,
        snoozedUntil = ?,
        notificationTime = ?
      WHERE id = ?`,
      [
        reminder.assetId,
        reminder.title,
        reminder.type,
        reminder.dueDate,
        JSON.stringify(reminder.alertOffsetsDays || [60, 30, 14, 3]),
        reminder.repeatFrequency || null,
        reminder.status,
        reminder.snoozedUntil || null,
        reminder.notificationTime || '09:00',
        reminder.id,
      ]
    );
  },

  async delete(id: string): Promise<void> {
    const db = getDb();
    await db.runAsync('DELETE FROM reminders WHERE id = ?', [id]);
  },

  async deleteAll(): Promise<void> {
    const db = getDb();
    await db.runAsync('DELETE FROM reminders');
  },

  async count(): Promise<number> {
    const db = getDb();
    const res = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM reminders'
    );
    return res?.count ?? 0;
  },
};
