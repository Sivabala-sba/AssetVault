import {
  calculateWarrantyEndDate,
  getWarrantyInfo,
  getWarrantyStatusFromDate,
  getWarrantyRelativeText,
  countByWarrantyStatus,
} from '../../src/logic/warranty';
import { format, addDays, subDays } from 'date-fns';
import type { Asset } from '../../src/types/models';

function makeAsset(overrides: Partial<Asset> = {}): Asset {
  return {
    id: 'test-1',
    name: 'Test Asset',
    category: 'electronics',
    photos: [],
    documents: [],
    maintenanceTasks: [],
    serviceHistory: [],
    reminders: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

// ─── calculateWarrantyEndDate ───────────────────────────────────────────────

describe('calculateWarrantyEndDate', () => {
  describe('Standard calculations', () => {
    test('purchase 10 Jan 2026 with 24 months gives expiry 9 Jan 2028 (user example)', () => {
      expect(calculateWarrantyEndDate('2026-01-10', 24)).toBe('2028-01-09');
    });

    test('1 Jan 2026 with 12 months gives expiry 31 Dec 2026', () => {
      expect(calculateWarrantyEndDate('2026-01-01', 12)).toBe('2026-12-31');
    });

    test('15 Aug 2025 with 6 months gives expiry 14 Feb 2026', () => {
      expect(calculateWarrantyEndDate('2025-08-15', 6)).toBe('2026-02-14');
    });

    test('1 Jun 2024 with 36 months gives expiry 31 May 2027', () => {
      expect(calculateWarrantyEndDate('2024-06-01', 36)).toBe('2027-05-31');
    });
  });

  describe('Month-end dates', () => {
    test('31 Jan 2026 + 1 month ends 27 Feb 2026 (non-leap year)', () => {
      expect(calculateWarrantyEndDate('2026-01-31', 1)).toBe('2026-02-27');
    });

    test('31 Jan 2024 + 1 month ends 28 Feb 2024 (leap year)', () => {
      expect(calculateWarrantyEndDate('2024-01-31', 1)).toBe('2024-02-28');
    });

    test('31 Mar 2026 + 1 month ends 29 Apr 2026', () => {
      expect(calculateWarrantyEndDate('2026-03-31', 1)).toBe('2026-04-29');
    });

    test('31 May 2026 + 1 month ends 29 Jun 2026', () => {
      expect(calculateWarrantyEndDate('2026-05-31', 1)).toBe('2026-06-29');
    });

    test('31 Aug 2026 + 1 month ends 29 Sep 2026', () => {
      expect(calculateWarrantyEndDate('2026-08-31', 1)).toBe('2026-09-29');
    });
  });

  describe('Leap years', () => {
    test('warranty starting on leap day 29 Feb 2024 with 12 months expires on 27 Feb 2025', () => {
      expect(calculateWarrantyEndDate('2024-02-29', 12)).toBe('2025-02-27');
    });

    test('warranty starting on leap day 29 Feb 2024 with 24 months expires on 27 Feb 2026', () => {
      expect(calculateWarrantyEndDate('2024-02-29', 24)).toBe('2026-02-27');
    });

    test('warranty starting on 1 Mar 2023 with 12 months spans leap day and expires on 29 Feb 2024', () => {
      expect(calculateWarrantyEndDate('2023-03-01', 12)).toBe('2024-02-29');
    });

    test('warranty starting on 28 Feb 2024 (leap year) with 12 months expires on 27 Feb 2025', () => {
      expect(calculateWarrantyEndDate('2024-02-28', 12)).toBe('2025-02-27');
    });
  });

  describe('Missing or invalid data', () => {
    test('returns null when start date is missing or undefined', () => {
      expect(calculateWarrantyEndDate(undefined, 12)).toBeNull();
      expect(calculateWarrantyEndDate(null, 12)).toBeNull();
      expect(calculateWarrantyEndDate('', 12)).toBeNull();
    });

    test('returns null when duration is missing or undefined', () => {
      expect(calculateWarrantyEndDate('2026-01-10', undefined)).toBeNull();
      expect(calculateWarrantyEndDate('2026-01-10', null)).toBeNull();
    });

    test('returns null when duration is zero or negative', () => {
      expect(calculateWarrantyEndDate('2026-01-10', 0)).toBeNull();
      expect(calculateWarrantyEndDate('2026-01-10', -12)).toBeNull();
    });

    test('returns null for invalid date string', () => {
      expect(calculateWarrantyEndDate('invalid-date', 12)).toBeNull();
    });
  });
});

// ─── getWarrantyInfo ─────────────────────────────────────────────────────────

describe('getWarrantyInfo', () => {
  test('returns "unknown" when no warranty data exists', () => {
    const asset = makeAsset();
    expect(getWarrantyInfo(asset).status).toBe('unknown');
  });

  test('returns "needsConfirmation" when duration is present but start date is missing', () => {
    const asset = makeAsset({
      warrantyDurationMonths: 24,
      warrantyStartDate: undefined,
    });
    const info = getWarrantyInfo(asset);
    expect(info.status).toBe('needsConfirmation');
    expect(info.needsConfirmation).toBe(true);
  });

  test('auto-derives expiry from startDate and durationMonths when warrantyEndDate is not set', () => {
    const asset = makeAsset({
      warrantyStartDate: '2026-01-10',
      warrantyDurationMonths: 24,
    });
    const info = getWarrantyInfo(asset);
    expect(info.endDate).toBe('2028-01-09');
  });

  test('returns "active" for far-future warranty end date (> 60 days)', () => {
    const future = format(addDays(new Date(), 100), 'yyyy-MM-dd');
    const asset = makeAsset({ warrantyEndDate: future });
    const info = getWarrantyInfo(asset);
    expect(info.status).toBe('active');
    expect(info.daysRemaining).toBeGreaterThan(60);
  });

  test('returns "expiringSoon" for warranty ending within 60 days (Stage 2 threshold)', () => {
    const in45Days = format(addDays(new Date(), 45), 'yyyy-MM-dd');
    const asset = makeAsset({ warrantyEndDate: in45Days });
    const info = getWarrantyInfo(asset);
    expect(info.status).toBe('expiringSoon');
    expect(info.daysRemaining).toBe(45);
  });

  test('returns "expiringSoon" for warranty ending in 60 days exactly', () => {
    const in60Days = format(addDays(new Date(), 60), 'yyyy-MM-dd');
    const asset = makeAsset({ warrantyEndDate: in60Days });
    expect(getWarrantyInfo(asset).status).toBe('expiringSoon');
  });

  test('returns "expiringSoon" for warranty ending today', () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const asset = makeAsset({ warrantyEndDate: today });
    const info = getWarrantyInfo(asset);
    expect(info.status).toBe('expiringSoon');
    expect(info.daysRemaining).toBe(0);
  });

  test('returns "expired" for past warranty end date', () => {
    const past = format(subDays(new Date(), 15), 'yyyy-MM-dd');
    const asset = makeAsset({ warrantyEndDate: past });
    const info = getWarrantyInfo(asset);
    expect(info.status).toBe('expired');
    expect(info.daysRemaining).toBe(-15);
  });

  test('returns "unknown" for invalid date string', () => {
    const asset = makeAsset({ warrantyEndDate: 'invalid-date' });
    expect(getWarrantyInfo(asset).status).toBe('unknown');
  });
});

// ─── getWarrantyRelativeText ────────────────────────────────────────────────

describe('getWarrantyRelativeText', () => {
  test('formats multiple days left', () => {
    expect(getWarrantyRelativeText({ status: 'active', daysRemaining: 45 })).toBe('45 days left');
  });

  test('formats single day left', () => {
    expect(getWarrantyRelativeText({ status: 'expiringSoon', daysRemaining: 1 })).toBe('1 day left');
  });

  test('formats expires today', () => {
    expect(getWarrantyRelativeText({ status: 'expiringSoon', daysRemaining: 0 })).toBe('Expires today');
  });

  test('formats expired yesterday', () => {
    expect(getWarrantyRelativeText({ status: 'expired', daysRemaining: -1 })).toBe('Expired yesterday');
  });

  test('formats expired multiple days ago', () => {
    expect(getWarrantyRelativeText({ status: 'expired', daysRemaining: -30 })).toBe('Expired 30 days ago');
  });

  test('formats needs confirmation', () => {
    expect(getWarrantyRelativeText({ status: 'needsConfirmation', needsConfirmation: true })).toBe('Needs confirmation');
  });

  test('formats unknown as no warranty', () => {
    expect(getWarrantyRelativeText({ status: 'unknown' })).toBe('No warranty');
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

  test('respects 60 days default threshold', () => {
    const inFiftyDays = format(addDays(new Date(), 50), 'yyyy-MM-dd');
    expect(getWarrantyStatusFromDate(inFiftyDays)).toBe('expiringSoon');

    const inSeventyDays = format(addDays(new Date(), 70), 'yyyy-MM-dd');
    expect(getWarrantyStatusFromDate(inSeventyDays)).toBe('active');
  });
});

// ─── countByWarrantyStatus ────────────────────────────────────────────────────

describe('countByWarrantyStatus', () => {
  test('counts assets by status correctly including needsConfirmation', () => {
    const assets = [
      makeAsset({ warrantyEndDate: format(addDays(new Date(), 200), 'yyyy-MM-dd') }), // active
      makeAsset({ warrantyEndDate: format(addDays(new Date(), 200), 'yyyy-MM-dd') }), // active
      makeAsset({ warrantyEndDate: format(addDays(new Date(), 45), 'yyyy-MM-dd') }),  // expiringSoon
      makeAsset({ warrantyEndDate: format(subDays(new Date(), 10), 'yyyy-MM-dd') }),  // expired
      makeAsset({ warrantyDurationMonths: 12 }),                                       // needsConfirmation
      makeAsset(),                                                                     // unknown
    ];

    const counts = countByWarrantyStatus(assets);
    expect(counts.active).toBe(2);
    expect(counts.expiringSoon).toBe(1);
    expect(counts.expired).toBe(1);
    expect(counts.needsConfirmation).toBe(1);
    expect(counts.unknown).toBe(1);
  });

  test('handles empty array', () => {
    const counts = countByWarrantyStatus([]);
    expect(counts.active).toBe(0);
    expect(counts.expiringSoon).toBe(0);
    expect(counts.expired).toBe(0);
    expect(counts.needsConfirmation).toBe(0);
    expect(counts.unknown).toBe(0);
  });
});
