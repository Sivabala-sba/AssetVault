import { parseISO, isValid, differenceInDays, addMonths, subDays, format } from 'date-fns';
import type { Asset, WarrantyInfo, WarrantyStatus } from '../types/models';
import { WARRANTY_EXPIRING_SOON_DAYS } from '../constants/categories';

/**
 * Calculates the warranty end date from start date and duration in months.
 *
 * Rules & Conventions:
 * - A warranty duration of N months starting on date D expires the day before the N-month anniversary.
 *   Example: 10 Jan 2026 + 24 months gives expiry 9 Jan 2028.
 *   Example: 1 Jan 2026 + 12 months gives expiry 31 Dec 2026.
 * - Handles month-end dates correctly:
 *   If start date is month-end (e.g. 31 Jan + 1 month), adding 1 month lands on 28 Feb
 *   (or 29 Feb in leap year), and subtracting 1 day yields 27 Feb (or 28 Feb).
 * - Leap year handling:
 *   A warranty starting on 29 Feb 2024 with 12 months expires on 27 Feb 2025.
 *   A warranty starting on 1 Mar 2023 with 12 months expires on 29 Feb 2024.
 * - If start date is missing or invalid: returns null (never guess!).
 * - If duration is missing, non-positive, or non-integer: returns null.
 */
export function calculateWarrantyEndDate(
  startDate?: string | null,
  durationMonths?: number | null
): string | null {
  if (!startDate || durationMonths === undefined || durationMonths === null) {
    return null;
  }

  const duration = Number(durationMonths);
  if (isNaN(duration) || duration <= 0 || !Number.isInteger(duration)) {
    return null;
  }

  // Ensure format is trimmed
  const cleaned = startDate.trim();
  const start = parseISO(cleaned);
  if (!isValid(start)) {
    return null;
  }

  // Add duration months, then end date is the day before anniversary
  const anniversary = addMonths(start, duration);
  const end = subDays(anniversary, 1);
  return format(end, 'yyyy-MM-dd');
}

/**
 * Calculates the warranty status and days remaining for an asset.
 * This is the single source of truth for warranty state across the app.
 *
 * Statuses:
 * - 'needsConfirmation': When warranty duration or provider is present, but start date is missing or invalid.
 * - 'expired': End date is in the past (daysRemaining < 0).
 * - 'expiringSoon': End date is within 60 days (0 <= daysRemaining <= 60).
 * - 'active': End date is more than 60 days away (daysRemaining > 60).
 * - 'unknown': No warranty data recorded.
 */
export function getWarrantyInfo(
  asset: Partial<Asset>,
  expiringSoonDays: number = WARRANTY_EXPIRING_SOON_DAYS,
  referenceDate: Date = new Date()
): WarrantyInfo {
  // If user entered duration but start date is missing/invalid, do NOT guess!
  if (
    asset.warrantyDurationMonths &&
    asset.warrantyDurationMonths > 0 &&
    !asset.warrantyEndDate
  ) {
    if (!asset.warrantyStartDate || !isValid(parseISO(asset.warrantyStartDate))) {
      return {
        status: 'needsConfirmation',
        needsConfirmation: true,
      };
    }
  }

  // Determine effective end date: either explicit warrantyEndDate, or derived from startDate + duration
  let effectiveEndDate = asset.warrantyEndDate;
  if (!effectiveEndDate && asset.warrantyStartDate && asset.warrantyDurationMonths) {
    const calculated = calculateWarrantyEndDate(
      asset.warrantyStartDate,
      asset.warrantyDurationMonths
    );
    if (calculated) {
      effectiveEndDate = calculated;
    }
  }

  if (!effectiveEndDate) {
    // If warranty provider is given or duration is given without start date, needs confirmation
    if (asset.warrantyDurationMonths || (asset.warrantyProvider && !asset.warrantyStartDate)) {
      return {
        status: 'needsConfirmation',
        needsConfirmation: true,
      };
    }
    return { status: 'unknown' };
  }

  const endDate = parseISO(effectiveEndDate);
  if (!isValid(endDate)) {
    return { status: 'unknown' };
  }

  const today = new Date(referenceDate);
  today.setHours(0, 0, 0, 0);

  // Normalize end date to midnight for day difference
  const targetDate = new Date(endDate);
  targetDate.setHours(0, 0, 0, 0);

  const daysRemaining = differenceInDays(targetDate, today);

  let status: WarrantyStatus;
  if (daysRemaining < 0) {
    status = 'expired';
  } else if (daysRemaining <= expiringSoonDays) {
    status = 'expiringSoon';
  } else {
    status = 'active';
  }

  return {
    status,
    daysRemaining,
    endDate: effectiveEndDate,
  };
}

/**
 * Returns user-friendly relative warranty line.
 * e.g. "45 days left", "1 day left", "Expires today", "Expired 12 days ago", "Needs confirmation".
 */
export function getWarrantyRelativeText(info: WarrantyInfo): string {
  if (info.status === 'needsConfirmation') {
    return 'Needs confirmation';
  }

  if (info.status === 'unknown' || info.daysRemaining === undefined) {
    return 'No warranty';
  }

  const days = info.daysRemaining;
  if (days > 1) {
    return `${days} days left`;
  }
  if (days === 1) {
    return '1 day left';
  }
  if (days === 0) {
    return 'Expires today';
  }
  if (days === -1) {
    return 'Expired yesterday';
  }
  return `Expired ${Math.abs(days)} days ago`;
}

/**
 * Returns the warranty status for a given end date string.
 */
export function getWarrantyStatusFromDate(
  warrantyEndDate?: string | null,
  expiringSoonDays: number = WARRANTY_EXPIRING_SOON_DAYS,
  referenceDate: Date = new Date()
): WarrantyStatus {
  if (!warrantyEndDate) return 'unknown';
  const endDate = parseISO(warrantyEndDate);
  if (!isValid(endDate)) return 'unknown';

  const today = new Date(referenceDate);
  today.setHours(0, 0, 0, 0);
  const days = differenceInDays(endDate, today);

  if (days < 0) return 'expired';
  if (days <= expiringSoonDays) return 'expiringSoon';
  return 'active';
}

/**
 * Counts assets by warranty status.
 */
export function countByWarrantyStatus(assets: Asset[]): {
  active: number;
  expiringSoon: number;
  expired: number;
  unknown: number;
  needsConfirmation: number;
} {
  return assets.reduce(
    (acc, asset) => {
      const { status } = getWarrantyInfo(asset);
      acc[status]++;
      return acc;
    },
    { active: 0, expiringSoon: 0, expired: 0, unknown: 0, needsConfirmation: 0 }
  );
}

/**
 * Returns assets sorted by warranty end date ascending (soonest first).
 * Assets without a warranty end date are sorted last.
 */
export function sortByWarrantyUrgency(assets: Asset[]): Asset[] {
  return [...assets].sort((a, b) => {
    const aEnd = a.warrantyEndDate ? parseISO(a.warrantyEndDate).getTime() : Infinity;
    const bEnd = b.warrantyEndDate ? parseISO(b.warrantyEndDate).getTime() : Infinity;
    return aEnd - bEnd;
  });
}
