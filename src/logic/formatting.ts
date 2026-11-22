import { format, parseISO, differenceInDays, isValid } from 'date-fns';

// ─── Date Formatting ──────────────────────────────────────────────────────────

/**
 * Formats an ISO date string to Indian convention: DD MMM YYYY
 * e.g. "2025-01-10" → "10 Jan 2025"
 * Returns "—" for null/undefined/invalid.
 */
export function formatIndianDate(isoDate?: string | null): string {
  if (!isoDate) return '—';
  try {
    const d = parseISO(isoDate);
    if (!isValid(d)) return '—';
    return format(d, 'dd MMM yyyy');
  } catch {
    return '—';
  }
}

/**
 * Formats a Date object to Indian convention: DD MMM YYYY
 */
export function formatDateObj(date: Date): string {
  if (!isValid(date)) return '—';
  return format(date, 'dd MMM yyyy');
}

/**
 * Returns the number of days between today and an ISO date.
 * Positive = future, negative = past.
 */
export function daysFromToday(isoDate: string): number {
  const d = parseISO(isoDate);
  if (!isValid(d)) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return differenceInDays(d, today);
}

/**
 * Returns "X days left", "Expired X days ago", "Expires today", etc.
 */
export function humanizeDaysRemaining(days: number): string {
  if (days === 0) return 'Expires today';
  if (days > 0) return `${days} day${days === 1 ? '' : 's'} left`;
  const abs = Math.abs(days);
  return `Expired ${abs} day${abs === 1 ? '' : 's'} ago`;
}

// ─── Currency Formatting ──────────────────────────────────────────────────────

/**
 * Formats a number as Indian Rupees with Indian grouping.
 * e.g. 128990 → "₹1,28,990"
 * e.g. 28990 → "₹28,990"
 * Returns "—" for null/undefined.
 */
export function formatINR(amount?: number | null): string {
  if (amount === null || amount === undefined) return '—';

  const isNegative = amount < 0;
  const abs = Math.abs(Math.round(amount));
  const str = abs.toString();

  let formatted: string;
  if (str.length <= 3) {
    formatted = str;
  } else {
    // Last 3 digits
    const last3 = str.slice(-3);
    // Remaining digits grouped in 2s from right
    const remaining = str.slice(0, -3);
    const groups: string[] = [];
    let i = remaining.length;
    while (i > 0) {
      groups.unshift(remaining.slice(Math.max(0, i - 2), i));
      i -= 2;
    }
    formatted = [...groups, last3].join(',');
  }

  return `${isNegative ? '-' : ''}₹${formatted}`;
}

/**
 * Parses an INR-formatted string back to a number.
 * e.g. "₹1,28,990" → 128990
 */
export function parseINR(value: string): number {
  const cleaned = value.replace(/[₹,\s]/g, '');
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

// ─── Phone Formatting ─────────────────────────────────────────────────────────

/**
 * Formats an Indian phone number.
 * Strips non-digits, handles +91 prefix.
 * 10-digit: "98765 43210"
 * With country code: "+91 98765 43210"
 * Returns original string if unrecognised format.
 */
export function formatIndianPhone(raw?: string | null): string {
  if (!raw) return '—';
  const digits = raw.replace(/\D/g, '');

  if (digits.length === 10) {
    return `${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    const number = digits.slice(2);
    return `+91 ${number.slice(0, 5)} ${number.slice(5)}`;
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    const number = digits.slice(1);
    return `${number.slice(0, 5)} ${number.slice(5)}`;
  }

  return raw; // return as-is if format unrecognised
}
