import { parseISO, isValid, differenceInDays, startOfDay } from 'date-fns';
import type { Asset, Reminder } from '../types/models';
import { getWarrantyInfo } from './warranty';
import { categorizeReminders } from './reminders';
import { WARRANTY_EXPIRING_SOON_DAYS } from '../constants/categories';

export interface DashboardSummary {
  totalAssets: number;
  totalPurchaseValue: number;
  activeWarrantiesCount: number;
  expiringSoonWarrantiesCount: number;
  overdueTasksCount: number;
}

export interface OverdueTaskItem {
  id: string;
  reminder: Reminder;
  asset?: Asset;
  daysOverdue: number;
}

export interface ExpiringSoonItem {
  id: string;
  type: 'warranty' | 'reminder';
  title: string;
  daysRemaining: number;
  dueDate: string;
  asset?: Asset;
  reminder?: Reminder;
}

export interface UpcomingTaskItem {
  id: string;
  reminder: Reminder;
  asset?: Asset;
  daysRemaining: number;
}

export interface DashboardData {
  summary: DashboardSummary;
  overdueTasks: OverdueTaskItem[];
  expiringSoon: ExpiringSoonItem[];
  upcomingTasks: UpcomingTaskItem[];
  recentAssets: Asset[];
}

/**
 * Computes all Home Dashboard sections in a single fast pass.
 * Designed to perform smoothly with 100+ assets.
 */
export function getDashboardData(
  assets: Asset[],
  reminders: Reminder[],
  referenceDate: Date = new Date()
): DashboardData {
  const today = startOfDay(referenceDate);

  // Map assets by id for O(1) lookup
  const assetMap = new Map<string, Asset>();
  let totalPurchaseValue = 0;
  let activeWarrantiesCount = 0;
  let expiringSoonWarrantiesCount = 0;

  const expiringWarranties: ExpiringSoonItem[] = [];

  for (const asset of assets) {
    assetMap.set(asset.id, asset);

    if (typeof asset.purchasePrice === 'number' && !isNaN(asset.purchasePrice)) {
      totalPurchaseValue += asset.purchasePrice;
    }

    const warranty = getWarrantyInfo(asset, WARRANTY_EXPIRING_SOON_DAYS, referenceDate);
    if (warranty.status === 'active' || warranty.status === 'expiringSoon') {
      activeWarrantiesCount++;
    }

    if (warranty.status === 'expiringSoon' && warranty.endDate && warranty.daysRemaining !== undefined) {
      expiringSoonWarrantiesCount++;
      expiringWarranties.push({
        id: `warranty-${asset.id}`,
        type: 'warranty',
        title: asset.name,
        daysRemaining: warranty.daysRemaining,
        dueDate: warranty.endDate,
        asset,
      });
    }
  }

  // Categorize reminders
  const categorized = categorizeReminders(reminders, referenceDate);

  // Overdue tasks
  const overdueTasks: OverdueTaskItem[] = categorized.overdue.map((rem) => {
    const due = parseISO(rem.dueDate);
    const daysOverdue = isValid(due)
      ? Math.max(1, differenceInDays(today, startOfDay(due)))
      : 1;

    return {
      id: `overdue-${rem.id}`,
      reminder: rem,
      asset: assetMap.get(rem.assetId),
      daysOverdue,
    };
  });

  // Sort overdue tasks: most overdue first
  overdueTasks.sort((a, b) => b.daysOverdue - a.daysOverdue);

  // Expiring reminders (due within 60 days, not overdue)
  const expiringReminders: ExpiringSoonItem[] = [];
  const upcomingTasks: UpcomingTaskItem[] = [];

  for (const rem of categorized.upcoming) {
    const due = parseISO(rem.dueDate);
    if (!isValid(due)) continue;

    const diff = differenceInDays(startOfDay(due), today);
    const asset = assetMap.get(rem.assetId);

    if (diff >= 0 && diff <= WARRANTY_EXPIRING_SOON_DAYS) {
      // Avoid duplicate alert if it's an auto-suggested warranty reminder for an asset already in expiringWarranties
      const alreadyHasWarrantyCard =
        rem.type === 'warrantyExpiry' &&
        expiringWarranties.some((w) => w.asset?.id === rem.assetId);

      if (!alreadyHasWarrantyCard) {
        expiringReminders.push({
          id: `reminder-${rem.id}`,
          type: 'reminder',
          title: rem.title,
          daysRemaining: diff,
          dueDate: rem.dueDate,
          asset,
          reminder: rem,
        });
      }
    }

    if (diff >= 0) {
      upcomingTasks.push({
        id: `upcoming-${rem.id}`,
        reminder: rem,
        asset,
        daysRemaining: diff,
      });
    }
  }

  // Combine expiring items and sort by daysRemaining ascending (soonest first)
  const expiringSoon = [...expiringWarranties, ...expiringReminders].sort(
    (a, b) => a.daysRemaining - b.daysRemaining
  );

  // Sort upcoming tasks by daysRemaining ascending
  upcomingTasks.sort((a, b) => a.daysRemaining - b.daysRemaining);

  // Recently added assets: sort by createdAt descending (fallback to purchaseDate)
  const recentAssets = [...assets]
    .sort((a, b) => {
      const t1 = new Date(a.createdAt || a.purchaseDate || 0).getTime();
      const t2 = new Date(b.createdAt || b.purchaseDate || 0).getTime();
      return t2 - t1;
    })
    .slice(0, 5);

  return {
    summary: {
      totalAssets: assets.length,
      totalPurchaseValue,
      activeWarrantiesCount,
      expiringSoonWarrantiesCount,
      overdueTasksCount: overdueTasks.length,
    },
    overdueTasks,
    expiringSoon,
    upcomingTasks: upcomingTasks.slice(0, 6),
    recentAssets,
  };
}
