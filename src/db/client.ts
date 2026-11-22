/**
 * Database client for AssetVault.
 *
 * Provides a resilient wrapper around expo-sqlite:
 * - If native ExpoSQLite is present (e.g. standard build or compatible client),
 *   it uses the real SQLiteDatabase.
 * - If native ExpoSQLite is unavailable (e.g. running in an Expo Go version whose
 *   native binary does not match the JS SDK package), it catches the module-load
 *   error safely and falls back to a clean in-memory relational store.
 *
 * This ensures the app never crashes on startup with:
 * "Cannot find native module 'ExpoSQLite'"
 */

export interface DatabaseClient {
  execAsync(sql: string): Promise<void>;
  runAsync(
    sql: string,
    params?: unknown[]
  ): Promise<{ lastInsertRowId?: number; changes?: number }>;
  getAllAsync<T = Record<string, unknown>>(
    sql: string,
    params?: unknown[]
  ): Promise<T[]>;
  getFirstAsync<T = Record<string, unknown>>(
    sql: string,
    params?: unknown[]
  ): Promise<T | null>;
}

// ─── In-Memory Fallback Implementation ────────────────────────────────────────

class InMemoryDatabase implements DatabaseClient {
  private assets = new Map<string, Record<string, unknown>>();
  private documents = new Map<string, Record<string, unknown>>();
  private maintenance = new Map<string, Record<string, unknown>>();
  private serviceHistory = new Map<string, Record<string, unknown>>();
  private reminders = new Map<string, Record<string, unknown>>();
  private schemaVersions = new Map<string, Record<string, unknown>>([
    ['1', { version: 1, appliedAt: new Date().toISOString() }],
  ]);

  async execAsync(sql: string): Promise<void> {
    if (sql.includes('DELETE FROM assets') || sql.includes('DELETE FROM reminders')) {
      this.reminders.clear();
      this.serviceHistory.clear();
      this.maintenance.clear();
      this.documents.clear();
      this.assets.clear();
    }
  }

  async runAsync(
    sql: string,
    params: unknown[] = []
  ): Promise<{ lastInsertRowId?: number; changes?: number }> {
    const cleanSql = sql.trim().toUpperCase();

    // INSERT INTO assets
    if (cleanSql.startsWith('INSERT INTO ASSETS')) {
      const colMatch = sql.match(/INSERT INTO assets\s*\(([^)]+)\)/i);
      if (colMatch) {
        const cols = colMatch[1].split(',').map((c) => c.trim());
        const row: Record<string, unknown> = {};
        cols.forEach((col, idx) => {
          row[col] = params[idx];
        });
        if (row.id) {
          this.assets.set(row.id as string, row);
        }
      }
      return { lastInsertRowId: 1, changes: 1 };
    }

    // UPDATE assets
    if (cleanSql.startsWith('UPDATE ASSETS SET')) {
      const id = params[params.length - 1] as string;
      const existing = this.assets.get(id) || {};
      const setMatch = sql.match(/SET\s+([\s\S]+?)\s+WHERE id=\?/i);
      if (setMatch) {
        const assignPairs = setMatch[1].split(',').map((p) => p.trim());
        assignPairs.forEach((pair, idx) => {
          const colName = pair.split('=')[0].trim();
          existing[colName] = params[idx];
        });
        this.assets.set(id, { ...existing, id });
      }
      return { changes: 1 };
    }

    // DELETE FROM assets WHERE id = ?
    if (cleanSql.startsWith('DELETE FROM ASSETS WHERE ID = ?')) {
      const id = params[0] as string;
      this.assets.delete(id);
      // Cascade delete related records
      for (const [k, v] of this.documents.entries()) {
        if (v.assetId === id) this.documents.delete(k);
      }
      for (const [k, v] of this.maintenance.entries()) {
        if (v.assetId === id) this.maintenance.delete(k);
      }
      for (const [k, v] of this.serviceHistory.entries()) {
        if (v.assetId === id) this.serviceHistory.delete(k);
      }
      for (const [k, v] of this.reminders.entries()) {
        if (v.assetId === id) this.reminders.delete(k);
      }
      return { changes: 1 };
    }

    // INSERT INTO asset_documents
    if (cleanSql.startsWith('INSERT INTO ASSET_DOCUMENTS')) {
      const colMatch = sql.match(/INSERT INTO asset_documents\s*\(([^)]+)\)/i);
      if (colMatch) {
        const cols = colMatch[1].split(',').map((c) => c.trim());
        const row: Record<string, unknown> = {};
        cols.forEach((col, idx) => {
          row[col] = params[idx];
        });
        if (row.id) this.documents.set(row.id as string, row);
      }
      return { changes: 1 };
    }

    // INSERT INTO maintenance_tasks
    if (cleanSql.startsWith('INSERT INTO MAINTENANCE_TASKS')) {
      const colMatch = sql.match(/INSERT INTO maintenance_tasks\s*\(([^)]+)\)/i);
      if (colMatch) {
        const cols = colMatch[1].split(',').map((c) => c.trim());
        const row: Record<string, unknown> = {};
        cols.forEach((col, idx) => {
          row[col] = params[idx];
        });
        if (row.id) this.maintenance.set(row.id as string, row);
      }
      return { changes: 1 };
    }

    // INSERT INTO service_history
    if (cleanSql.startsWith('INSERT INTO SERVICE_HISTORY')) {
      const colMatch = sql.match(/INSERT INTO service_history\s*\(([^)]+)\)/i);
      if (colMatch) {
        const cols = colMatch[1].split(',').map((c) => c.trim());
        const row: Record<string, unknown> = {};
        cols.forEach((col, idx) => {
          row[col] = params[idx];
        });
        if (row.id) this.serviceHistory.set(row.id as string, row);
      }
      return { changes: 1 };
    }

    // INSERT INTO reminders
    if (cleanSql.startsWith('INSERT INTO REMINDERS')) {
      const colMatch = sql.match(/INSERT INTO reminders\s*\(([^)]+)\)/i);
      if (colMatch) {
        const cols = colMatch[1].split(',').map((c) => c.trim());
        const row: Record<string, unknown> = {};
        cols.forEach((col, idx) => {
          row[col] = params[idx];
        });
        if (row.id) this.reminders.set(row.id as string, row);
      }
      return { changes: 1 };
    }

    // INSERT INTO schema_versions
    if (cleanSql.startsWith('INSERT INTO SCHEMA_VERSIONS')) {
      const ver = params[0] as number;
      this.schemaVersions.set(String(ver), { version: ver, appliedAt: params[1] });
      return { changes: 1 };
    }

    return { changes: 0 };
  }

  async getAllAsync<T = Record<string, unknown>>(
    sql: string,
    params: unknown[] = []
  ): Promise<T[]> {
    const cleanSql = sql.trim().toUpperCase();

    // SELECT * FROM assets ORDER BY createdAt DESC
    if (cleanSql.startsWith('SELECT * FROM ASSETS')) {
      const rows = Array.from(this.assets.values());
      rows.sort((a, b) => {
        const d1 = new Date((b.createdAt as string) || 0).getTime();
        const d2 = new Date((a.createdAt as string) || 0).getTime();
        return d1 - d2;
      });
      return rows as unknown as T[];
    }

    // SELECT * FROM asset_documents WHERE assetId = ?
    if (cleanSql.startsWith('SELECT * FROM ASSET_DOCUMENTS')) {
      const assetId = params[0] as string;
      const rows = Array.from(this.documents.values()).filter(
        (r) => r.assetId === assetId
      );
      return rows as unknown as T[];
    }

    // SELECT * FROM maintenance_tasks WHERE assetId = ?
    if (cleanSql.startsWith('SELECT * FROM MAINTENANCE_TASKS')) {
      const assetId = params[0] as string;
      const rows = Array.from(this.maintenance.values()).filter(
        (r) => r.assetId === assetId
      );
      return rows as unknown as T[];
    }

    // SELECT * FROM service_history WHERE assetId = ?
    if (cleanSql.startsWith('SELECT * FROM SERVICE_HISTORY')) {
      const assetId = params[0] as string;
      const rows = Array.from(this.serviceHistory.values()).filter(
        (r) => r.assetId === assetId
      );
      return rows as unknown as T[];
    }

    // SELECT * FROM reminders WHERE assetId = ?
    if (cleanSql.startsWith('SELECT * FROM REMINDERS')) {
      const assetId = params[0] as string;
      const rows = Array.from(this.reminders.values()).filter(
        (r) => r.assetId === assetId
      );
      return rows as unknown as T[];
    }

    return [];
  }

  async getFirstAsync<T = Record<string, unknown>>(
    sql: string,
    params: unknown[] = []
  ): Promise<T | null> {
    const cleanSql = sql.trim().toUpperCase();

    // SELECT COUNT(*) as count FROM assets
    if (cleanSql.includes('COUNT(*)') && cleanSql.includes('FROM ASSETS')) {
      return { count: this.assets.size } as unknown as T;
    }

    // SELECT MAX(version) as version FROM schema_versions
    if (cleanSql.includes('MAX(VERSION)') || cleanSql.includes('SCHEMA_VERSIONS')) {
      return { version: 1 } as unknown as T;
    }

    // SELECT * FROM assets WHERE id = ?
    if (cleanSql.startsWith('SELECT * FROM ASSETS WHERE ID = ?')) {
      const id = params[0] as string;
      const row = this.assets.get(id);
      return (row ? { ...row } : null) as unknown as T;
    }

    return null;
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

let dbInstance: DatabaseClient | null = null;

export function getDb(): DatabaseClient {
  if (dbInstance) return dbInstance;

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { requireOptionalNativeModule } = require('expo');
    const nativeModule =
      typeof requireOptionalNativeModule === 'function'
        ? requireOptionalNativeModule('ExpoSQLite')
        : null;

    if (nativeModule) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const SQLite = require('expo-sqlite');
      if (SQLite && typeof SQLite.openDatabaseSync === 'function') {
        const realDb = SQLite.openDatabaseSync('assetvault.db');
        if (realDb && typeof realDb.execAsync === 'function') {
          dbInstance = realDb;
          return dbInstance!;
        }
      }
    }
  } catch (err) {
    // Ignore and use fallback
  }

  dbInstance = new InMemoryDatabase();
  return dbInstance;
}
