import { parseISO, isValid, differenceInDays } from 'date-fns';
import type { Asset, WarrantyInfo, WarrantyStatus } from '../types/models';
import { WARRANTY_EXPIRING_SOON_DAYS } from '../constants/categories';

/**
 * Calculates the warranty status and days remaining for an asset.
 * This is the single source of truth for warranty state.
 */
export function getWarrantyInfo(asset: Asset): WarrantyInfo {
  if (!asset.warrantyEndDate) {
    return { status: 'unknown' };
  }

  const endDate = parseISO(asset.warrantyEndDate);
  if (!isValid(endDate)) {
    return { status: 'unknown' };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysRemaining = differenceInDays(endDate, today);

  let status: WarrantyStatus;
  if (daysRemaining < 0) {
    status = 'expired';
  } else if (daysRemaining <= WARRANTY_EXPIRING_SOON_DAYS) {
    status = 'expiringSoon';
  } else {
    status = 'active';
  }

  return {
    status,
    daysRemaining,
    endDate: asset.warrantyEndDate,
  };
}

/**
 * Returns the warranty status for a given end date string.
 * Useful when you don't have a full Asset object.
 */
export function getWarrantyStatusFromDate(
  warrantyEndDate?: string | null,
  expiringSoonDays: number = WARRANTY_EXPIRING_SOON_DAYS
): WarrantyStatus {
  if (!warrantyEndDate) return 'unknown';
  const endDate = parseISO(warrantyEndDate);
  if (!isValid(endDate)) return 'unknown';

  const today = new Date();
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
} {
  return assets.reduce(
    (acc, asset) => {
      const { status } = getWarrantyInfo(asset);
      acc[status]++;
      return acc;
    },
    { active: 0, expiringSoon: 0, expired: 0, unknown: 0 }
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
