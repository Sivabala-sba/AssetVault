import type { CategoryMeta } from '../types/models';

export const CATEGORIES: CategoryMeta[] = [
  { key: 'homeAppliance',    labelKey: 'categories.homeAppliance',    icon: 'fridge-outline' },
  { key: 'electronics',      labelKey: 'categories.electronics',      icon: 'laptop' },
  { key: 'vehicle',          labelKey: 'categories.vehicle',          icon: 'car-outline' },
  { key: 'furniture',        labelKey: 'categories.furniture',        icon: 'sofa-outline' },
  { key: 'homeEquipment',    labelKey: 'categories.homeEquipment',    icon: 'home-lightning-bolt-outline' },
  { key: 'tools',            labelKey: 'categories.tools',            icon: 'toolbox-outline' },
  { key: 'importantDocument',labelKey: 'categories.importantDocument',icon: 'file-document-outline' },
  { key: 'custom',           labelKey: 'categories.custom',           icon: 'shape-outline' },
];

export const CATEGORY_MAP = Object.fromEntries(
  CATEGORIES.map((c) => [c.key, c])
) as Record<string, CategoryMeta>;

/** Default reminder offsets in days before expiry */
export const DEFAULT_ALERT_OFFSETS_DAYS = [60, 30, 14, 3];

/** Days before warrantyEndDate to consider "expiring soon" */
export const WARRANTY_EXPIRING_SOON_DAYS = 90;
