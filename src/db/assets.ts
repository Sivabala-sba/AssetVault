import { getDb } from './client';
import type { Asset, AssetDocument, MaintenanceTask, ServiceHistoryEntry, Reminder } from '../types/models';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseJson<T>(json: string | null | undefined, fallback: T): T {
  if (!json) return fallback;
  try { return JSON.parse(json) as T; } catch { return fallback; }
}

function rowToAsset(row: Record<string, unknown>): Omit<Asset, 'documents' | 'maintenanceTasks' | 'serviceHistory' | 'reminders'> {
  return {
    id:                     row.id as string,
    name:                   row.name as string,
    category:               row.category as Asset['category'],
    brand:                  row.brand as string | undefined,
    modelNumber:            row.modelNumber as string | undefined,
    serialNumber:           row.serialNumber as string | undefined,
    imeiNumber:             row.imeiNumber as string | undefined,
    purchaseDate:           row.purchaseDate as string | undefined,
    purchasePrice:          row.purchasePrice as number | undefined,
    seller:                 row.seller as string | undefined,
    invoiceNumber:          row.invoiceNumber as string | undefined,
    location:               row.location as string | undefined,
    warrantyProvider:       row.warrantyProvider as string | undefined,
    warrantyStartDate:      row.warrantyStartDate as string | undefined,
    warrantyEndDate:        row.warrantyEndDate as string | undefined,
    warrantyDurationMonths: row.warrantyDurationMonths as number | undefined,
    customerCareNumber:     row.customerCareNumber as string | undefined,
    notes:                  row.notes as string | undefined,
    photos:                 parseJson<string[]>(row.photos as string, []),
    createdAt:              row.createdAt as string,
    updatedAt:              row.updatedAt as string,
  };
}

// ─── Documents ────────────────────────────────────────────────────────────────

async function getDocumentsForAsset(assetId: string): Promise<AssetDocument[]> {
  const db = getDb();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM asset_documents WHERE assetId = ? ORDER BY addedAt ASC',
    [assetId]
  );
  return rows.map((r) => ({
    id:            r.id as string,
    type:          r.type as AssetDocument['type'],
    fileUri:       r.fileUri as string,
    extractedText: r.extractedText as string | undefined,
    addedAt:       r.addedAt as string,
  }));
}

// ─── Maintenance Tasks ────────────────────────────────────────────────────────

async function getMaintenanceForAsset(assetId: string): Promise<MaintenanceTask[]> {
  const db = getDb();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM maintenance_tasks WHERE assetId = ? ORDER BY nextDueDate ASC',
    [assetId]
  );
  return rows.map((r) => ({
    id:              r.id as string,
    title:           r.title as string,
    frequencyMonths: r.frequencyMonths as number,
    lastDoneDate:    r.lastDoneDate as string | undefined,
    nextDueDate:     r.nextDueDate as string,
    isSuggestion:    Boolean(r.isSuggestion),
  }));
}

// ─── Service History ──────────────────────────────────────────────────────────

async function getServiceHistoryForAsset(assetId: string): Promise<ServiceHistoryEntry[]> {
  const db = getDb();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM service_history WHERE assetId = ? ORDER BY date DESC',
    [assetId]
  );
  return rows.map((r) => ({
    id:                r.id as string,
    date:              r.date as string,
    serviceProvider:   r.serviceProvider as string,
    technicianName:    r.technicianName as string | undefined,
    cost:              r.cost as number,
    workPerformed:     r.workPerformed as string,
    partsReplaced:     r.partsReplaced as string | undefined,
    invoiceDocumentId: r.invoiceDocumentId as string | undefined,
  }));
}

// ─── Reminders ────────────────────────────────────────────────────────────────

async function getRemindersForAsset(assetId: string): Promise<Reminder[]> {
  const db = getDb();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM reminders WHERE assetId = ? ORDER BY dueDate ASC',
    [assetId]
  );
  return rows.map((r) => ({
    id:               r.id as string,
    assetId:          r.assetId as string,
    title:            r.title as string,
    type:             r.type as Reminder['type'],
    dueDate:          r.dueDate as string,
    alertOffsetsDays: parseJson<number[]>(r.alertOffsetsDays as string, [60, 30, 14, 3]),
    repeatFrequency:  r.repeatFrequency as Reminder['repeatFrequency'],
    status:           r.status as Reminder['status'],
    snoozedUntil:     r.snoozedUntil as string | undefined,
  }));
}

// ─── Full Asset Assembly ──────────────────────────────────────────────────────

async function assembleFullAsset(baseRow: Record<string, unknown>): Promise<Asset> {
  const id = baseRow.id as string;
  const [documents, maintenanceTasks, serviceHistory, reminders] = await Promise.all([
    getDocumentsForAsset(id),
    getMaintenanceForAsset(id),
    getServiceHistoryForAsset(id),
    getRemindersForAsset(id),
  ]);
  return { ...rowToAsset(baseRow), documents, maintenanceTasks, serviceHistory, reminders };
}

// ─── Public Repository API ────────────────────────────────────────────────────

export const assetRepository = {
  async getAll(): Promise<Asset[]> {
    const db = getDb();
    const rows = await db.getAllAsync<Record<string, unknown>>(
      'SELECT * FROM assets ORDER BY createdAt DESC'
    );
    return Promise.all(rows.map(assembleFullAsset));
  },

  async getById(id: string): Promise<Asset | null> {
    const db = getDb();
    const row = await db.getFirstAsync<Record<string, unknown>>(
      'SELECT * FROM assets WHERE id = ?',
      [id]
    );
    if (!row) return null;
    return assembleFullAsset(row);
  },

  async insert(asset: Asset): Promise<void> {
    const db = getDb();
    await db.runAsync(
      `INSERT INTO assets (
        id, name, category, brand, modelNumber, serialNumber, imeiNumber,
        purchaseDate, purchasePrice, seller, invoiceNumber, location,
        warrantyProvider, warrantyStartDate, warrantyEndDate, warrantyDurationMonths,
        customerCareNumber, notes, photos, createdAt, updatedAt
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        asset.id, asset.name, asset.category,
        asset.brand ?? null, asset.modelNumber ?? null, asset.serialNumber ?? null,
        asset.imeiNumber ?? null, asset.purchaseDate ?? null,
        asset.purchasePrice ?? null, asset.seller ?? null,
        asset.invoiceNumber ?? null, asset.location ?? null,
        asset.warrantyProvider ?? null, asset.warrantyStartDate ?? null,
        asset.warrantyEndDate ?? null, asset.warrantyDurationMonths ?? null,
        asset.customerCareNumber ?? null, asset.notes ?? null,
        JSON.stringify(asset.photos), asset.createdAt, asset.updatedAt,
      ]
    );

    // Insert related records
    for (const doc of asset.documents) {
      await db.runAsync(
        'INSERT INTO asset_documents (id, assetId, type, fileUri, extractedText, addedAt) VALUES (?,?,?,?,?,?)',
        [doc.id, asset.id, doc.type, doc.fileUri, doc.extractedText ?? null, doc.addedAt]
      );
    }
    for (const task of asset.maintenanceTasks) {
      await db.runAsync(
        'INSERT INTO maintenance_tasks (id, assetId, title, frequencyMonths, lastDoneDate, nextDueDate, isSuggestion) VALUES (?,?,?,?,?,?,?)',
        [task.id, asset.id, task.title, task.frequencyMonths, task.lastDoneDate ?? null, task.nextDueDate, task.isSuggestion ? 1 : 0]
      );
    }
    for (const entry of asset.serviceHistory) {
      await db.runAsync(
        'INSERT INTO service_history (id, assetId, date, serviceProvider, technicianName, cost, workPerformed, partsReplaced, invoiceDocumentId) VALUES (?,?,?,?,?,?,?,?,?)',
        [entry.id, asset.id, entry.date, entry.serviceProvider, entry.technicianName ?? null, entry.cost, entry.workPerformed, entry.partsReplaced ?? null, entry.invoiceDocumentId ?? null]
      );
    }
    for (const reminder of asset.reminders) {
      await db.runAsync(
        'INSERT INTO reminders (id, assetId, title, type, dueDate, alertOffsetsDays, repeatFrequency, status, snoozedUntil) VALUES (?,?,?,?,?,?,?,?,?)',
        [reminder.id, asset.id, reminder.title, reminder.type, reminder.dueDate, JSON.stringify(reminder.alertOffsetsDays), reminder.repeatFrequency ?? null, reminder.status, reminder.snoozedUntil ?? null]
      );
    }
  },

  async update(asset: Asset): Promise<void> {
    const db = getDb();
    const now = new Date().toISOString();
    await db.runAsync(
      `UPDATE assets SET
        name=?, category=?, brand=?, modelNumber=?, serialNumber=?, imeiNumber=?,
        purchaseDate=?, purchasePrice=?, seller=?, invoiceNumber=?, location=?,
        warrantyProvider=?, warrantyStartDate=?, warrantyEndDate=?, warrantyDurationMonths=?,
        customerCareNumber=?, notes=?, photos=?, updatedAt=?
       WHERE id=?`,
      [
        asset.name, asset.category,
        asset.brand ?? null, asset.modelNumber ?? null, asset.serialNumber ?? null,
        asset.imeiNumber ?? null, asset.purchaseDate ?? null,
        asset.purchasePrice ?? null, asset.seller ?? null,
        asset.invoiceNumber ?? null, asset.location ?? null,
        asset.warrantyProvider ?? null, asset.warrantyStartDate ?? null,
        asset.warrantyEndDate ?? null, asset.warrantyDurationMonths ?? null,
        asset.customerCareNumber ?? null, asset.notes ?? null,
        JSON.stringify(asset.photos), now,
        asset.id,
      ]
    );
  },

  async delete(id: string): Promise<void> {
    const db = getDb();
    // Cascade deletes handle related records via FK ON DELETE CASCADE
    await db.runAsync('DELETE FROM assets WHERE id = ?', [id]);
  },

  async deleteAll(): Promise<void> {
    const db = getDb();
    await db.execAsync(`
      DELETE FROM reminders;
      DELETE FROM service_history;
      DELETE FROM maintenance_tasks;
      DELETE FROM asset_documents;
      DELETE FROM assets;
    `);
  },

  async count(): Promise<number> {
    const db = getDb();
    const result = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM assets'
    );
    return result?.count ?? 0;
  },
};
