import { getDashboardData } from '../../src/logic/dashboard';
import type { Asset, Reminder } from '../../src/types/models';

describe('Home Dashboard Logic', () => {
  const referenceDate = new Date('2026-06-01T10:00:00Z');

  const asset1: Asset = {
    id: 'asset-1',
    name: 'Washing Machine',
    category: 'homeAppliance',
    purchasePrice: 35000,
    warrantyStartDate: '2024-07-17',
    warrantyDurationMonths: 24, // End date: 2026-07-16 -> 45 days from 2026-06-01
    photos: [],
    documents: [],
    maintenanceTasks: [],
    serviceHistory: [],
    reminders: [],
    createdAt: '2026-05-01T10:00:00Z',
    updatedAt: '2026-05-01T10:00:00Z',
  };

  const asset2: Asset = {
    id: 'asset-2',
    name: 'Living Room AC',
    category: 'homeAppliance',
    purchasePrice: 48000,
    warrantyStartDate: '2026-01-01',
    warrantyDurationMonths: 12, // End date: 2026-12-31 -> > 60 days, active
    photos: [],
    documents: [],
    maintenanceTasks: [],
    serviceHistory: [],
    reminders: [],
    createdAt: '2026-05-10T10:00:00Z',
    updatedAt: '2026-05-10T10:00:00Z',
  };

  const asset3: Asset = {
    id: 'asset-3',
    name: 'Dining Table',
    category: 'furniture',
    purchasePrice: 22000,
    photos: [],
    documents: [],
    maintenanceTasks: [],
    serviceHistory: [],
    reminders: [],
    createdAt: '2026-05-15T10:00:00Z',
    updatedAt: '2026-05-15T10:00:00Z',
  };

  const reminderOverdue: Reminder = {
    id: 'rem-overdue-1',
    assetId: 'asset-1',
    title: 'Clean Drain Filter',
    type: 'maintenanceDue',
    dueDate: '2026-05-20', // 12 days overdue
    alertOffsetsDays: [3],
    status: 'upcoming',
  };

  const reminderExpiringSoon: Reminder = {
    id: 'rem-expiring-1',
    assetId: 'asset-2',
    title: 'AC Gas Inspection',
    type: 'maintenanceDue',
    dueDate: '2026-06-21', // 20 days away
    alertOffsetsDays: [7],
    status: 'upcoming',
  };

  const reminderUpcomingLater: Reminder = {
    id: 'rem-later-1',
    assetId: 'asset-3',
    title: 'Wood Polish',
    type: 'custom',
    dueDate: '2026-09-01', // > 60 days away
    alertOffsetsDays: [7],
    status: 'upcoming',
  };

  it('computes summary metrics accurately', () => {
    const data = getDashboardData(
      [asset1, asset2, asset3],
      [reminderOverdue, reminderExpiringSoon, reminderUpcomingLater],
      referenceDate
    );

    // Total assets: 3
    expect(data.summary.totalAssets).toBe(3);
    // Total purchase value: 35000 + 48000 + 22000 = 105000
    expect(data.summary.totalPurchaseValue).toBe(105000);
    // Active warranties: asset1 (expiringSoon) + asset2 (active) = 2
    expect(data.summary.activeWarrantiesCount).toBe(2);
    // Expiring soon count: asset1 warranty = 1
    expect(data.summary.expiringSoonWarrantiesCount).toBe(1);
    // Overdue count: 1
    expect(data.summary.overdueTasksCount).toBe(1);
  });

  it('identifies and sorts overdue tasks', () => {
    const data = getDashboardData(
      [asset1, asset2, asset3],
      [reminderOverdue],
      referenceDate
    );

    expect(data.overdueTasks).toHaveLength(1);
    expect(data.overdueTasks[0].reminder.id).toBe('rem-overdue-1');
    expect(data.overdueTasks[0].asset?.name).toBe('Washing Machine');
    expect(data.overdueTasks[0].daysOverdue).toBe(12);
  });

  it('identifies expiring soon items within 60 days (warranties and reminders)', () => {
    const data = getDashboardData(
      [asset1, asset2, asset3],
      [reminderExpiringSoon],
      referenceDate
    );

    // asset1 warranty expires in 45 days, reminderExpiringSoon is in 20 days
    expect(data.expiringSoon).toHaveLength(2);

    // Sorted soonest first: 20 days then 45 days
    expect(data.expiringSoon[0].daysRemaining).toBe(20);
    expect(data.expiringSoon[0].type).toBe('reminder');
    expect(data.expiringSoon[0].title).toBe('AC Gas Inspection');

    expect(data.expiringSoon[1].daysRemaining).toBe(45);
    expect(data.expiringSoon[1].type).toBe('warranty');
    expect(data.expiringSoon[1].title).toBe('Washing Machine');
  });

  it('orders recently added assets descending by createdAt', () => {
    const data = getDashboardData(
      [asset1, asset2, asset3],
      [],
      referenceDate
    );

    // asset3 (15 May), asset2 (10 May), asset1 (1 May)
    expect(data.recentAssets[0].id).toBe('asset-3');
    expect(data.recentAssets[1].id).toBe('asset-2');
    expect(data.recentAssets[2].id).toBe('asset-1');
  });

  it('handles empty data gracefully without throwing', () => {
    const data = getDashboardData([], [], referenceDate);

    expect(data.summary.totalAssets).toBe(0);
    expect(data.summary.totalPurchaseValue).toBe(0);
    expect(data.summary.activeWarrantiesCount).toBe(0);
    expect(data.overdueTasks).toEqual([]);
    expect(data.expiringSoon).toEqual([]);
    expect(data.upcomingTasks).toEqual([]);
    expect(data.recentAssets).toEqual([]);
  });

  it('executes efficiently with 100+ assets', () => {
    const largeAssetList: Asset[] = Array.from({ length: 150 }, (_, i) => ({
      id: `bulk-${i}`,
      name: `Asset ${i}`,
      category: 'electronics',
      purchasePrice: 1000 * (i + 1),
      warrantyStartDate: '2026-01-01',
      warrantyDurationMonths: 12,
      photos: [],
      documents: [],
      maintenanceTasks: [],
      serviceHistory: [],
      reminders: [],
      createdAt: '2026-05-01T00:00:00Z',
      updatedAt: '2026-05-01T00:00:00Z',
    }));

    const start = Date.now();
    const data = getDashboardData(largeAssetList, [reminderOverdue], referenceDate);
    const durationMs = Date.now() - start;

    expect(data.summary.totalAssets).toBe(150);
    expect(durationMs).toBeLessThan(100); // Super fast under 100ms
  });
});
