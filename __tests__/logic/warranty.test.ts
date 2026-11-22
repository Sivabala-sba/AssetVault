import { getWarrantyInfo, getWarrantyStatusFromDate, countByWarrantyStatus } from '../../src/logic/warranty';
import { format, addDays, subDays } from 'date-fns';
import type { Asset } from '../../src/types/models';

function makeAsset(warrantyEndDate?: string): Asset {
  return {
    id: 'test-1',
    name: 'Test Asset',
    category: 'electronics',
    warrantyEndDate,
    photos: [],
    documents: [],
    maintenanceTasks: [],
    serviceHistory: [],
    reminders: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// ─── getWarrantyInfo ─────────────────────────────────────────────────────────

describe('getWarrantyInfo', () => {
  test('returns "unknown" when no warrantyEndDate', () => {
    const asset = makeAsset(undefined);
    expect(getWarrantyInfo(asset).status).toBe('unknown');
  });

  test('returns "active" for far-future warranty end date', () => {
    const future = format(addDays(new Date(), 200), 'yyyy-MM-dd');
    const asset = makeAsset(future);
    const info = getWarrantyInfo(asset);
    expect(info.status).toBe('active');
    expect(info.daysRemaining).toBeGreaterThan(90);
  });

  test('returns "expiringSoon" for warranty ending within 90 days', () => {
    const soon = format(addDays(new Date(), 45), 'yyyy-MM-dd');
    const asset = makeAsset(soon);
    const info = getWarrantyInfo(asset);
    expect(info.status).toBe('expiringSoon');
    expect(info.daysRemaining).toBe(45);
  });

  test('returns "expiringSoon" for warranty ending today', () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const asset = makeAsset(today);
    expect(getWarrantyInfo(asset).status).toBe('expiringSoon');
  });

  test('returns "expired" for past warranty end date', () => {
    const past = format(subDays(new Date(), 30), 'yyyy-MM-dd');
    const asset = makeAsset(past);
    const info = getWarrantyInfo(asset);
    expect(info.status).toBe('expired');
    expect(info.daysRemaining).toBe(-30);
  });

  test('returns "unknown" for invalid date string', () => {
    const asset = makeAsset('invalid-date');
    expect(getWarrantyInfo(asset).status).toBe('unknown');
  });
});

// ─── getWarrantyStatusFromDate ────────────────────────────────────────────────

describe('getWarrantyStatusFromDate', () => {
  test('returns "unknown" for null', () => {
    expect(getWarrantyStatusFromDate(null)).toBe('unknown');
  });

  test('returns "active" for far future', () => {
    const future = format(addDays(new Date(), 365), 'yyyy-MM-dd');
    expect(getWarrantyStatusFromDate(future)).toBe('active');
  });

  test('respects custom expiringSoonDays threshold', () => {
    const inThirtyDays = format(addDays(new Date(), 30), 'yyyy-MM-dd');
    expect(getWarrantyStatusFromDate(inThirtyDays, 60)).toBe('expiringSoon');
    expect(getWarrantyStatusFromDate(inThirtyDays, 20)).toBe('active');
  });
});

// ─── countByWarrantyStatus ────────────────────────────────────────────────────

describe('countByWarrantyStatus', () => {
  test('counts assets by status correctly', () => {
    const assets = [
      makeAsset(format(addDays(new Date(), 200), 'yyyy-MM-dd')), // active
      makeAsset(format(addDays(new Date(), 200), 'yyyy-MM-dd')), // active
      makeAsset(format(addDays(new Date(), 45), 'yyyy-MM-dd')),  // expiringSoon
      makeAsset(format(subDays(new Date(), 10), 'yyyy-MM-dd')),  // expired
      makeAsset(undefined),                                       // unknown
    ];

    const counts = countByWarrantyStatus(assets);
    expect(counts.active).toBe(2);
    expect(counts.expiringSoon).toBe(1);
    expect(counts.expired).toBe(1);
    expect(counts.unknown).toBe(1);
  });

  test('handles empty array', () => {
    const counts = countByWarrantyStatus([]);
    expect(counts.active).toBe(0);
    expect(counts.expiringSoon).toBe(0);
    expect(counts.expired).toBe(0);
    expect(counts.unknown).toBe(0);
  });
});
