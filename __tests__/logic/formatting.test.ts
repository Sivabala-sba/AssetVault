import {
  formatIndianDate,
  formatINR,
  parseINR,
  formatIndianPhone,
  daysFromToday,
  humanizeDaysRemaining,
} from '../../src/logic/formatting';
import { format, addDays, subDays } from 'date-fns';

// ─── formatIndianDate ─────────────────────────────────────────────────────────

describe('formatIndianDate', () => {
  test('formats ISO date to DD MMM YYYY', () => {
    expect(formatIndianDate('2025-01-10')).toBe('10 Jan 2025');
  });

  test('formats single-digit day without padding removal', () => {
    expect(formatIndianDate('2026-03-05')).toBe('05 Mar 2026');
  });

  test('returns em-dash for null', () => {
    expect(formatIndianDate(null)).toBe('—');
  });

  test('returns em-dash for undefined', () => {
    expect(formatIndianDate(undefined)).toBe('—');
  });

  test('returns em-dash for invalid date string', () => {
    expect(formatIndianDate('not-a-date')).toBe('—');
  });

  test('handles month boundaries correctly', () => {
    expect(formatIndianDate('2026-12-31')).toBe('31 Dec 2026');
    expect(formatIndianDate('2026-01-01')).toBe('01 Jan 2026');
  });
});

// ─── formatINR ───────────────────────────────────────────────────────────────

describe('formatINR', () => {
  test('formats amounts under 1000 without grouping', () => {
    expect(formatINR(500)).toBe('₹500');
  });

  test('formats 4-digit amounts with one comma', () => {
    expect(formatINR(1000)).toBe('₹1,000');
    expect(formatINR(9999)).toBe('₹9,999');
  });

  test('formats 5-digit amounts: Indian grouping (last 3 + 2)', () => {
    expect(formatINR(28990)).toBe('₹28,990');
    expect(formatINR(99999)).toBe('₹99,999');
  });

  test('formats 6-digit amounts: Indian grouping (1,00,000)', () => {
    expect(formatINR(100000)).toBe('₹1,00,000');
    expect(formatINR(128990)).toBe('₹1,28,990');
  });

  test('formats 7-digit amounts: Indian grouping (12,80,000)', () => {
    expect(formatINR(1280000)).toBe('₹12,80,000');
  });

  test('formats large amounts (crore range)', () => {
    expect(formatINR(10000000)).toBe('₹1,00,00,000');
  });

  test('rounds decimals to nearest integer', () => {
    expect(formatINR(1234.9)).toBe('₹1,235');
    expect(formatINR(1234.4)).toBe('₹1,234');
  });

  test('handles zero', () => {
    expect(formatINR(0)).toBe('₹0');
  });

  test('handles negative amounts', () => {
    expect(formatINR(-28990)).toBe('-₹28,990');
  });

  test('returns em-dash for null', () => {
    expect(formatINR(null)).toBe('—');
  });

  test('returns em-dash for undefined', () => {
    expect(formatINR(undefined)).toBe('—');
  });
});

// ─── parseINR ────────────────────────────────────────────────────────────────

describe('parseINR', () => {
  test('parses formatted INR string back to number', () => {
    expect(parseINR('₹1,28,990')).toBe(128990);
    expect(parseINR('₹28,990')).toBe(28990);
  });

  test('returns 0 for empty string', () => {
    expect(parseINR('')).toBe(0);
  });

  test('handles plain number string', () => {
    expect(parseINR('50000')).toBe(50000);
  });
});

// ─── formatIndianPhone ────────────────────────────────────────────────────────

describe('formatIndianPhone', () => {
  test('formats 10-digit number', () => {
    expect(formatIndianPhone('9876543210')).toBe('98765 43210');
  });

  test('formats number with +91 prefix', () => {
    expect(formatIndianPhone('+919876543210')).toBe('+91 98765 43210');
  });

  test('formats number with 91 prefix (no +)', () => {
    expect(formatIndianPhone('919876543210')).toBe('+91 98765 43210');
  });

  test('formats number starting with 0', () => {
    expect(formatIndianPhone('09876543210')).toBe('98765 43210');
  });

  test('returns em-dash for null', () => {
    expect(formatIndianPhone(null)).toBe('—');
  });

  test('returns em-dash for undefined', () => {
    expect(formatIndianPhone(undefined)).toBe('—');
  });

  test('returns original string for unrecognised format', () => {
    expect(formatIndianPhone('123')).toBe('123');
  });

  test('strips spaces and dashes before formatting', () => {
    expect(formatIndianPhone('98765-43210')).toBe('98765 43210');
    expect(formatIndianPhone('98765 43210')).toBe('98765 43210');
  });
});

// ─── daysFromToday ────────────────────────────────────────────────────────────

describe('daysFromToday', () => {
  test('returns positive days for future date', () => {
    const future = format(addDays(new Date(), 30), 'yyyy-MM-dd');
    expect(daysFromToday(future)).toBe(30);
  });

  test('returns negative days for past date', () => {
    const past = format(subDays(new Date(), 10), 'yyyy-MM-dd');
    expect(daysFromToday(past)).toBe(-10);
  });

  test('returns 0 for today', () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    expect(daysFromToday(today)).toBe(0);
  });
});

// ─── humanizeDaysRemaining ────────────────────────────────────────────────────

describe('humanizeDaysRemaining', () => {
  test('returns "Expires today" for 0 days', () => {
    expect(humanizeDaysRemaining(0)).toBe('Expires today');
  });

  test('returns singular "day left" for 1 day', () => {
    expect(humanizeDaysRemaining(1)).toBe('1 day left');
  });

  test('returns plural "days left" for >1 day', () => {
    expect(humanizeDaysRemaining(30)).toBe('30 days left');
  });

  test('returns "Expired X days ago" for negative', () => {
    expect(humanizeDaysRemaining(-5)).toBe('Expired 5 days ago');
  });

  test('returns singular for -1', () => {
    expect(humanizeDaysRemaining(-1)).toBe('Expired 1 day ago');
  });
});
