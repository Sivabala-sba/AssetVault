import {
  calculateNextOccurrence,
  categorizeReminders,
  calculateAlertDates,
  createWarrantyExpiryReminderSuggestion,
} from '../../src/logic/reminders';
import type { Asset, Reminder } from '../../src/types/models';

describe('Reminders Logic', () => {
  describe('calculateNextOccurrence', () => {
    it('returns null for repeatFrequency="none" or undefined', () => {
      const reminder: Reminder = {
        id: 'r1',
        assetId: 'a1',
        title: 'Filter Cleaning',
        type: 'maintenanceDue',
        dueDate: '2026-05-10',
        alertOffsetsDays: [3],
        repeatFrequency: 'none',
        status: 'upcoming',
      };
      expect(calculateNextOccurrence(reminder)).toBeNull();
    });

    it('calculates monthly occurrence correctly', () => {
      const reminder: Reminder = {
        id: 'r1',
        assetId: 'a1',
        title: 'Water filter check',
        type: 'maintenanceDue',
        dueDate: '2026-03-15',
        alertOffsetsDays: [3],
        repeatFrequency: 'monthly',
        status: 'upcoming',
      };
      const next = calculateNextOccurrence(reminder);
      expect(next).toEqual({ dueDate: '2026-04-15' });
    });

    it('handles month-end dates gracefully for monthly recurrence (Jan 31 -> Feb 28)', () => {
      const reminder: Reminder = {
        id: 'r1',
        assetId: 'a1',
        title: 'Monthly inspection',
        type: 'maintenanceDue',
        dueDate: '2025-01-31',
        alertOffsetsDays: [3],
        repeatFrequency: 'monthly',
        status: 'upcoming',
      };
      const next = calculateNextOccurrence(reminder);
      expect(next).toEqual({ dueDate: '2025-02-28' });
    });

    it('calculates yearly occurrence correctly', () => {
      const reminder: Reminder = {
        id: 'r2',
        assetId: 'a2',
        title: 'Car Insurance Renewal',
        type: 'insuranceRenewal',
        dueDate: '2026-11-20',
        alertOffsetsDays: [30, 14, 3],
        repeatFrequency: 'yearly',
        status: 'upcoming',
      };
      const next = calculateNextOccurrence(reminder);
      expect(next).toEqual({ dueDate: '2027-11-20' });
    });

    it('handles leap-year leap day for yearly recurrence (2024-02-29 -> 2025-02-28)', () => {
      const reminder: Reminder = {
        id: 'r3',
        assetId: 'a3',
        title: 'Special service',
        type: 'custom',
        dueDate: '2024-02-29',
        alertOffsetsDays: [7],
        repeatFrequency: 'yearly',
        status: 'upcoming',
      };
      const next = calculateNextOccurrence(reminder);
      expect(next).toEqual({ dueDate: '2025-02-28' });
    });
  });

  describe('categorizeReminders', () => {
    const referenceDate = new Date('2026-06-15T12:00:00Z');

    const upcomingReminder: Reminder = {
      id: 'r-upcoming',
      assetId: 'a1',
      title: 'AC Service',
      type: 'maintenanceDue',
      dueDate: '2026-07-01',
      alertOffsetsDays: [14],
      status: 'upcoming',
    };

    const overdueReminder: Reminder = {
      id: 'r-overdue',
      assetId: 'a1',
      title: 'Car PUC Renewal',
      type: 'custom',
      dueDate: '2026-06-10',
      alertOffsetsDays: [3],
      status: 'upcoming',
    };

    const snoozedReminder: Reminder = {
      id: 'r-snoozed',
      assetId: 'a2',
      title: 'Purifier filter change',
      type: 'maintenanceDue',
      dueDate: '2026-06-12',
      alertOffsetsDays: [3],
      status: 'snoozed',
      snoozedUntil: '2026-06-20',
    };

    const completedReminder: Reminder = {
      id: 'r-completed',
      assetId: 'a3',
      title: 'Warranty Card Scan',
      type: 'custom',
      dueDate: '2026-05-01',
      alertOffsetsDays: [],
      status: 'completed',
    };

    it('correctly splits reminders into 4 segments', () => {
      const categorized = categorizeReminders(
        [upcomingReminder, overdueReminder, snoozedReminder, completedReminder],
        referenceDate
      );

      expect(categorized.upcoming).toHaveLength(1);
      expect(categorized.upcoming[0].id).toBe('r-upcoming');

      expect(categorized.overdue).toHaveLength(1);
      expect(categorized.overdue[0].id).toBe('r-overdue');

      expect(categorized.snoozed).toHaveLength(1);
      expect(categorized.snoozed[0].id).toBe('r-snoozed');

      expect(categorized.completed).toHaveLength(1);
      expect(categorized.completed[0].id).toBe('r-completed');
    });
  });

  describe('calculateAlertDates', () => {
    it('calculates alert dates with correct offsets and time', () => {
      const dates = calculateAlertDates('2026-10-15', [30, 7], '14:30');
      expect(dates).toHaveLength(2);

      // 30 days before Oct 15 is Sep 15
      expect(dates[0].getFullYear()).toBe(2026);
      expect(dates[0].getMonth()).toBe(8); // September (0-indexed)
      expect(dates[0].getDate()).toBe(15);
      expect(dates[0].getHours()).toBe(14);
      expect(dates[0].getMinutes()).toBe(30);

      // 7 days before Oct 15 is Oct 8
      expect(dates[1].getFullYear()).toBe(2026);
      expect(dates[1].getMonth()).toBe(9); // October
      expect(dates[1].getDate()).toBe(8);
      expect(dates[1].getHours()).toBe(14);
      expect(dates[1].getMinutes()).toBe(30);
    });
  });

  describe('createWarrantyExpiryReminderSuggestion', () => {
    const baseAsset: Asset = {
      id: 'asset-test-1',
      name: 'Sony Bravia TV',
      category: 'electronics',
      purchaseDate: '2026-01-10',
      warrantyStartDate: '2026-01-10',
      warrantyDurationMonths: 24,
      photos: [],
      documents: [],
      maintenanceTasks: [],
      serviceHistory: [],
      reminders: [],
      createdAt: '2026-01-10T10:00:00Z',
      updatedAt: '2026-01-10T10:00:00Z',
    };

    it('generates a suggestion for an asset with warranty expiry date', () => {
      const suggestion = createWarrantyExpiryReminderSuggestion(baseAsset, []);
      expect(suggestion).not.toBeNull();
      expect(suggestion?.title).toBe('Sony Bravia TV - Warranty Expiry');
      expect(suggestion?.dueDate).toBe('2028-01-09');
      expect(suggestion?.alertOffsetsDays).toEqual([60, 30, 14, 3]);
      expect(suggestion?.status).toBe('upcoming');
    });

    it('returns null if a warranty expiry reminder already exists', () => {
      const existingReminder: Reminder = {
        id: 'rem-1',
        assetId: 'asset-test-1',
        title: 'Sony Bravia TV - Warranty Expiry',
        type: 'warrantyExpiry',
        dueDate: '2028-01-09',
        alertOffsetsDays: [60, 30, 14, 3],
        status: 'upcoming',
      };
      const suggestion = createWarrantyExpiryReminderSuggestion(baseAsset, [existingReminder]);
      expect(suggestion).toBeNull();
    });

    it('returns null if asset has no warranty expiry or needs confirmation', () => {
      const assetWithoutWarranty: Asset = {
        id: 'asset-test-2',
        name: 'Dining Table',
        category: 'furniture',
        photos: [],
        documents: [],
        maintenanceTasks: [],
        serviceHistory: [],
        reminders: [],
        createdAt: '2026-01-10T10:00:00Z',
        updatedAt: '2026-01-10T10:00:00Z',
      };
      const suggestion = createWarrantyExpiryReminderSuggestion(assetWithoutWarranty, []);
      expect(suggestion).toBeNull();
    });
  });
});
