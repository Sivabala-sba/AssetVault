// ─── Core Asset Model ────────────────────────────────────────────────────────

export type DocumentType =
  | 'invoice'
  | 'warrantyCard'
  | 'productLabel'
  | 'manual'
  | 'insurance'
  | 'serviceReceipt'
  | 'registrationCertificate'
  | 'other';

export interface AssetDocument {
  id: string;
  assetId?: string;
  title?: string;
  type: DocumentType;
  fileUri: string;
  extractedText?: string;
  mimeType?: string;
  addedAt: string; // ISO date string
}

export interface MaintenanceTask {
  id: string;
  title: string;
  frequencyMonths: number;
  lastDoneDate?: string; // ISO date string
  nextDueDate: string;   // ISO date string
  isSuggestion: boolean;
}

export interface ServiceHistoryEntry {
  id: string;
  date: string; // ISO date string
  serviceProvider: string;
  technicianName?: string;
  cost: number;
  workPerformed: string;
  partsReplaced?: string;
  invoiceDocumentId?: string;
}

export type ReminderType =
  | 'warrantyExpiry'
  | 'maintenanceDue'
  | 'insuranceRenewal'
  | 'amcRenewal'
  | 'custom';

export type ReminderStatus = 'upcoming' | 'completed' | 'snoozed' | 'skipped';

export interface Reminder {
  id: string;
  assetId: string;
  title: string;
  type: ReminderType;
  dueDate: string; // ISO date string
  alertOffsetsDays: number[]; // e.g. [60, 30, 14, 3]
  repeatFrequency?: 'monthly' | 'yearly' | 'none';
  status: ReminderStatus;
  snoozedUntil?: string; // ISO date string
  notificationTime?: string; // e.g. '09:00' (Stage 3)
}

export type AssetCategory =
  | 'homeAppliance'
  | 'electronics'
  | 'vehicle'
  | 'furniture'
  | 'homeEquipment'
  | 'tools'
  | 'importantDocument'
  | 'custom';

export interface Asset {
  id: string;
  name: string;
  category: AssetCategory;
  brand?: string;
  modelNumber?: string;
  serialNumber?: string;
  imeiNumber?: string;
  purchaseDate?: string;     // ISO date string
  purchasePrice?: number;    // INR
  seller?: string;
  invoiceNumber?: string;
  location?: string;
  warrantyProvider?: string;
  warrantyStartDate?: string; // ISO date string
  warrantyEndDate?: string;   // ISO date string
  warrantyDurationMonths?: number;
  coverageDetails?: string;   // Scope of warranty coverage (Stage 2)
  exclusions?: string;        // Items not covered (Stage 2)
  customerCareNumber?: string;
  claimInstructions?: string; // How to raise a claim (Stage 2)
  notes?: string;
  photos: string[];          // file URIs
  documents: AssetDocument[];
  maintenanceTasks: MaintenanceTask[];
  serviceHistory: ServiceHistoryEntry[];
  reminders: Reminder[];
  createdAt: string;         // ISO date string
  updatedAt: string;         // ISO date string
}

// ─── Warranty Status ──────────────────────────────────────────────────────────

export type WarrantyStatus =
  | 'active'
  | 'expiringSoon'
  | 'expired'
  | 'unknown'
  | 'needsConfirmation';

export interface WarrantyInfo {
  status: WarrantyStatus;
  daysRemaining?: number;
  endDate?: string;
  needsConfirmation?: boolean;
}

// ─── UI / Display helpers ─────────────────────────────────────────────────────

export interface CategoryMeta {
  key: AssetCategory;
  labelKey: string;      // i18n key
  icon: string;          // MaterialCommunityIcons name
}
