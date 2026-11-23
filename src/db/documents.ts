import { getDb } from './client';
import type { AssetDocument, DocumentType } from '../types/models';

function rowToDocument(r: Record<string, unknown>): AssetDocument {
  return {
    id: r.id as string,
    assetId: (r.assetId as string) || undefined,
    title: (r.title as string) || undefined,
    type: r.type as DocumentType,
    fileUri: r.fileUri as string,
    extractedText: (r.extractedText as string) || undefined,
    mimeType: (r.mimeType as string) || undefined,
    addedAt: r.addedAt as string,
  };
}

export const documentRepository = {
  async getForAsset(assetId: string): Promise<AssetDocument[]> {
    const db = getDb();
    const rows = await db.getAllAsync<Record<string, unknown>>(
      'SELECT * FROM asset_documents WHERE assetId = ? ORDER BY addedAt ASC',
      [assetId]
    );
    return rows.map(rowToDocument);
  },

  async getById(id: string): Promise<AssetDocument | null> {
    const db = getDb();
    const row = await db.getFirstAsync<Record<string, unknown>>(
      'SELECT * FROM asset_documents WHERE id = ?',
      [id]
    );
    return row ? rowToDocument(row) : null;
  },

  async insert(doc: AssetDocument & { assetId: string }): Promise<void> {
    const db = getDb();
    await db.runAsync(
      `INSERT INTO asset_documents (id, assetId, title, type, fileUri, extractedText, mimeType, addedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        doc.id,
        doc.assetId,
        doc.title ?? null,
        doc.type,
        doc.fileUri,
        doc.extractedText ?? null,
        doc.mimeType ?? null,
        doc.addedAt || new Date().toISOString(),
      ]
    );
  },

  async update(
    id: string,
    updates: Partial<Pick<AssetDocument, 'title' | 'type'>>
  ): Promise<void> {
    const db = getDb();
    const fields: string[] = [];
    const params: unknown[] = [];

    if (updates.title !== undefined) {
      fields.push('title = ?');
      params.push(updates.title);
    }
    if (updates.type !== undefined) {
      fields.push('type = ?');
      params.push(updates.type);
    }

    if (fields.length === 0) return;

    params.push(id);
    await db.runAsync(
      `UPDATE asset_documents SET ${fields.join(', ')} WHERE id = ?`,
      params
    );
  },

  async delete(id: string): Promise<void> {
    const db = getDb();
    await db.runAsync('DELETE FROM asset_documents WHERE id = ?', [id]);
  },
};
