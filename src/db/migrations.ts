import { getDb } from './client';

/**
 * Runs all DDL migrations to create tables if they don't exist.
 * Called once on app startup.
 */
export async function initDatabase(): Promise<void> {
  const db = getDb();

  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS assets (
      id                    TEXT PRIMARY KEY NOT NULL,
      name                  TEXT NOT NULL,
      category              TEXT NOT NULL,
      brand                 TEXT,
      modelNumber           TEXT,
      serialNumber          TEXT,
      imeiNumber            TEXT,
      purchaseDate          TEXT,
      purchasePrice         REAL,
      seller                TEXT,
      invoiceNumber         TEXT,
      location              TEXT,
      warrantyProvider      TEXT,
      warrantyStartDate     TEXT,
      warrantyEndDate       TEXT,
      warrantyDurationMonths INTEGER,
      coverageDetails       TEXT,
      exclusions            TEXT,
      customerCareNumber    TEXT,
      claimInstructions     TEXT,
      notes                 TEXT,
      photos                TEXT NOT NULL DEFAULT '[]',
      createdAt             TEXT NOT NULL,
      updatedAt             TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS asset_documents (
      id            TEXT PRIMARY KEY NOT NULL,
      assetId       TEXT NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
      title         TEXT,
      type          TEXT NOT NULL,
      fileUri       TEXT NOT NULL,
      extractedText TEXT,
      mimeType      TEXT,
      addedAt       TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS maintenance_tasks (
      id              TEXT PRIMARY KEY NOT NULL,
      assetId         TEXT NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
      title           TEXT NOT NULL,
      frequencyMonths INTEGER NOT NULL,
      lastDoneDate    TEXT,
      nextDueDate     TEXT NOT NULL,
      isSuggestion    INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS service_history (
      id                 TEXT PRIMARY KEY NOT NULL,
      assetId            TEXT NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
      date               TEXT NOT NULL,
      serviceProvider    TEXT NOT NULL,
      technicianName     TEXT,
      cost               REAL NOT NULL DEFAULT 0,
      workPerformed      TEXT NOT NULL,
      partsReplaced      TEXT,
      invoiceDocumentId  TEXT
    );

    CREATE TABLE IF NOT EXISTS reminders (
      id               TEXT PRIMARY KEY NOT NULL,
      assetId          TEXT NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
      title            TEXT NOT NULL,
      type             TEXT NOT NULL,
      dueDate          TEXT NOT NULL,
      alertOffsetsDays TEXT NOT NULL DEFAULT '[60,30,14,3]',
      repeatFrequency  TEXT,
      status           TEXT NOT NULL DEFAULT 'upcoming',
      snoozedUntil     TEXT,
      notificationTime TEXT DEFAULT '09:00'
    );
  `);
}
