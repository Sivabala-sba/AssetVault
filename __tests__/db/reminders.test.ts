import { reminderRepository } from '../../src/db/reminders';
import type { Reminder } from '../../src/types/models';

describe('reminderRepository', () => {
  beforeEach(async () => {
    await reminderRepository.deleteAll();
  });

  const sampleReminder: Reminder = {
    id: 'rem-db-1',
    assetId: 'asset-101',
    title: 'AC Gas Check',
    type: 'maintenanceDue',
    dueDate: '2026-08-15',
    alertOffsetsDays: [30, 14, 3],
    repeatFrequency: 'monthly',
    status: 'upcoming',
    notificationTime: '10:00',
  };

  it('inserts and retrieves a reminder by ID and for asset', async () => {
    await reminderRepository.insert(sampleReminder);

    const fetched = await reminderRepository.getById('rem-db-1');
    expect(fetched).not.toBeNull();
    expect(fetched?.title).toBe('AC Gas Check');
    expect(fetched?.alertOffsetsDays).toEqual([30, 14, 3]);
    expect(fetched?.notificationTime).toBe('10:00');

    const assetReminders = await reminderRepository.getForAsset('asset-101');
    expect(assetReminders).toHaveLength(1);
    expect(assetReminders[0].id).toBe('rem-db-1');
  });

  it('updates an existing reminder', async () => {
    await reminderRepository.insert(sampleReminder);

    const updated: Reminder = {
      ...sampleReminder,
      title: 'AC Gas Check & Filter',
      status: 'snoozed',
      snoozedUntil: '2026-08-20',
    };
    await reminderRepository.update(updated);

    const fetched = await reminderRepository.getById('rem-db-1');
    expect(fetched?.title).toBe('AC Gas Check & Filter');
    expect(fetched?.status).toBe('snoozed');
    expect(fetched?.snoozedUntil).toBe('2026-08-20');
  });

  it('deletes a reminder', async () => {
    await reminderRepository.insert(sampleReminder);
    expect(await reminderRepository.count()).toBe(1);

    await reminderRepository.delete('rem-db-1');
    expect(await reminderRepository.count()).toBe(0);
    expect(await reminderRepository.getById('rem-db-1')).toBeNull();
  });
});
