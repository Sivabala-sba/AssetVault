import type { AssetCategory } from '../types/models';

// ─── Category Meta (top-level groups) ─────────────────────────────────────────

export interface CategoryMeta {
  key: AssetCategory;
  labelKey: string;
  icon: string;
}

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

// ─── Sub-types (product templates) ────────────────────────────────────────────

export interface SubTypeMeta {
  key: string;
  labelKey: string;
  icon: string;
  category: AssetCategory;
  suggestedLocations: string[];
  showImei?: boolean;
}

export const SUB_TYPES: SubTypeMeta[] = [
  // Home Appliances
  { key: 'airConditioner',  labelKey: 'subTypes.airConditioner',  icon: 'air-conditioner',         category: 'homeAppliance',  suggestedLocations: ['Master Bedroom', 'Living Room', 'Hall', 'Bedroom'] },
  { key: 'refrigerator',    labelKey: 'subTypes.refrigerator',    icon: 'fridge-outline',          category: 'homeAppliance',  suggestedLocations: ['Kitchen'] },
  { key: 'washingMachine',  labelKey: 'subTypes.washingMachine',  icon: 'washing-machine',         category: 'homeAppliance',  suggestedLocations: ['Utility Room', 'Bathroom', 'Balcony'] },
  { key: 'waterPurifier',   labelKey: 'subTypes.waterPurifier',   icon: 'water-outline',           category: 'homeAppliance',  suggestedLocations: ['Kitchen'] },
  { key: 'microwave',       labelKey: 'subTypes.microwave',       icon: 'microwave',               category: 'homeAppliance',  suggestedLocations: ['Kitchen'] },
  { key: 'dishwasher',      labelKey: 'subTypes.dishwasher',      icon: 'dishwasher',              category: 'homeAppliance',  suggestedLocations: ['Kitchen'] },
  { key: 'otherAppliance',  labelKey: 'subTypes.otherAppliance',  icon: 'fridge-outline',          category: 'homeAppliance',  suggestedLocations: ['Kitchen', 'Living Room', 'Bedroom'] },

  // Electronics
  { key: 'television',      labelKey: 'subTypes.television',      icon: 'television',              category: 'electronics',    suggestedLocations: ['Living Room', 'Master Bedroom', 'Bedroom'] },
  { key: 'laptop',          labelKey: 'subTypes.laptop',          icon: 'laptop',                  category: 'electronics',    suggestedLocations: ['Home Office', 'Bedroom'] },
  { key: 'smartphone',      labelKey: 'subTypes.smartphone',      icon: 'cellphone',               category: 'electronics',    suggestedLocations: ['Personal'], showImei: true },
  { key: 'tablet',          labelKey: 'subTypes.tablet',          icon: 'tablet',                  category: 'electronics',    suggestedLocations: ['Personal', 'Home Office'], showImei: true },
  { key: 'camera',          labelKey: 'subTypes.camera',          icon: 'camera-outline',          category: 'electronics',    suggestedLocations: ['Home Office', 'Personal'] },
  { key: 'smartwatch',      labelKey: 'subTypes.smartwatch',      icon: 'watch-variant',           category: 'electronics',    suggestedLocations: ['Personal'] },
  { key: 'otherElectronic', labelKey: 'subTypes.otherElectronic', icon: 'laptop',                  category: 'electronics',    suggestedLocations: ['Home Office', 'Living Room'] },

  // Vehicles
  { key: 'car',             labelKey: 'subTypes.car',             icon: 'car-outline',             category: 'vehicle',        suggestedLocations: ['Garage', 'Parking'] },
  { key: 'motorcycle',      labelKey: 'subTypes.motorcycle',      icon: 'motorbike',               category: 'vehicle',        suggestedLocations: ['Garage', 'Parking'] },
  { key: 'scooter',         labelKey: 'subTypes.scooter',         icon: 'moped-outline',           category: 'vehicle',        suggestedLocations: ['Garage', 'Parking'] },
  { key: 'bicycle',         labelKey: 'subTypes.bicycle',         icon: 'bicycle',                 category: 'vehicle',        suggestedLocations: ['Garage', 'Balcony'] },
  { key: 'otherVehicle',    labelKey: 'subTypes.otherVehicle',    icon: 'car-outline',             category: 'vehicle',        suggestedLocations: ['Garage'] },

  // Furniture
  { key: 'sofa',            labelKey: 'subTypes.sofa',            icon: 'sofa-outline',            category: 'furniture',      suggestedLocations: ['Living Room', 'Hall'] },
  { key: 'bed',             labelKey: 'subTypes.bed',             icon: 'bed-outline',             category: 'furniture',      suggestedLocations: ['Master Bedroom', 'Bedroom'] },
  { key: 'table',           labelKey: 'subTypes.table',           icon: 'table-furniture',         category: 'furniture',      suggestedLocations: ['Dining Room', 'Home Office', 'Living Room'] },
  { key: 'otherFurniture',  labelKey: 'subTypes.otherFurniture',  icon: 'sofa-outline',            category: 'furniture',      suggestedLocations: ['Living Room', 'Bedroom'] },

  // Home Equipment
  { key: 'inverter',        labelKey: 'subTypes.inverter',        icon: 'battery-charging-outline',category: 'homeEquipment',  suggestedLocations: ['Living Room', 'Utility Room'] },
  { key: 'generator',       labelKey: 'subTypes.generator',       icon: 'engine-outline',          category: 'homeEquipment',  suggestedLocations: ['Terrace', 'Garage'] },
  { key: 'solarSystem',     labelKey: 'subTypes.solarSystem',     icon: 'solar-panel',             category: 'homeEquipment',  suggestedLocations: ['Terrace', 'Rooftop'] },
  { key: 'cctv',            labelKey: 'subTypes.cctv',            icon: 'cctv',                    category: 'homeEquipment',  suggestedLocations: ['Entrance', 'Garage', 'Hallway'] },
  { key: 'pump',            labelKey: 'subTypes.pump',            icon: 'water-pump',              category: 'homeEquipment',  suggestedLocations: ['Utility Room', 'Terrace'] },
  { key: 'otherEquipment',  labelKey: 'subTypes.otherEquipment',  icon: 'home-lightning-bolt-outline',category: 'homeEquipment',suggestedLocations: ['Utility Room'] },

  // Tools
  { key: 'powerTool',       labelKey: 'subTypes.powerTool',       icon: 'saw-blade',               category: 'tools',          suggestedLocations: ['Garage', 'Workshop'] },
  { key: 'handTool',        labelKey: 'subTypes.handTool',        icon: 'wrench-outline',          category: 'tools',          suggestedLocations: ['Garage', 'Workshop'] },
  { key: 'otherTool',       labelKey: 'subTypes.otherTool',       icon: 'toolbox-outline',         category: 'tools',          suggestedLocations: ['Garage', 'Workshop'] },

  // Important Documents
  { key: 'insurancePolicy', labelKey: 'subTypes.insurancePolicy', icon: 'shield-check-outline',    category: 'importantDocument', suggestedLocations: ['Home Office', 'Personal'] },
  { key: 'amcContract',     labelKey: 'subTypes.amcContract',     icon: 'file-sign',               category: 'importantDocument', suggestedLocations: ['Home Office'] },
  { key: 'extendedWarranty',labelKey: 'subTypes.extendedWarranty',icon: 'certificate-outline',     category: 'importantDocument', suggestedLocations: ['Home Office'] },
  { key: 'serviceContract', labelKey: 'subTypes.serviceContract', icon: 'file-document-edit-outline', category: 'importantDocument', suggestedLocations: ['Home Office'] },
  { key: 'otherDocument',   labelKey: 'subTypes.otherDocument',   icon: 'file-document-outline',   category: 'importantDocument', suggestedLocations: ['Home Office'] },

  // Custom
  { key: 'customItem',      labelKey: 'subTypes.customItem',      icon: 'shape-outline',           category: 'custom',         suggestedLocations: [] },
];

export const SUB_TYPES_BY_CATEGORY = SUB_TYPES.reduce<Record<string, SubTypeMeta[]>>(
  (acc, st) => {
    if (!acc[st.category]) acc[st.category] = [];
    acc[st.category].push(st);
    return acc;
  },
  {} as Record<string, SubTypeMeta[]>
);

export const SUB_TYPE_MAP = Object.fromEntries(
  SUB_TYPES.map((st) => [st.key, st])
) as Record<string, SubTypeMeta>;

/** Common locations for the location picker */
export const COMMON_LOCATIONS = [
  'Kitchen', 'Living Room', 'Master Bedroom', 'Bedroom',
  'Bathroom', 'Utility Room', 'Home Office', 'Garage',
  'Balcony', 'Terrace', 'Rooftop', 'Hall', 'Dining Room',
  'Entrance', 'Hallway', 'Workshop', 'Parking', 'Personal',
];
