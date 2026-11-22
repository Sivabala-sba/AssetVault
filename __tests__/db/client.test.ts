import { getDb } from '../../src/db/client';

describe('Database client', () => {
  it('provides a valid database client instance', () => {
    const db = getDb();
    expect(db).toBeDefined();
    expect(typeof db.execAsync).toBe('function');
    expect(typeof db.runAsync).toBe('function');
    expect(typeof db.getAllAsync).toBe('function');
    expect(typeof db.getFirstAsync).toBe('function');
  });

  it('can execute DDL queries without throwing', async () => {
    const db = getDb();
    await expect(db.execAsync('PRAGMA foreign_keys = ON;')).resolves.toBeUndefined();
  });
});
