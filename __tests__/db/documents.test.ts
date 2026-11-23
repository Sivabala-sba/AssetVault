import { documentRepository } from '../../src/db/documents';
import type { AssetDocument } from '../../src/types/models';

describe('documentRepository', () => {
  const sampleDoc: AssetDocument & { assetId: string } = {
    id: 'doc-test-1',
    assetId: 'asset-100',
    title: 'AC Purchase Invoice',
    type: 'invoice',
    fileUri: 'file:///data/user/0/documents/doc-test-1.jpg',
    mimeType: 'image/jpeg',
    addedAt: '2026-06-01T10:00:00Z',
  };

  it('inserts and retrieves documents for an asset', async () => {
    await documentRepository.insert(sampleDoc);

    const docs = await documentRepository.getForAsset('asset-100');
    expect(docs).toHaveLength(1);
    expect(docs[0].id).toBe('doc-test-1');
    expect(docs[0].title).toBe('AC Purchase Invoice');
    expect(docs[0].type).toBe('invoice');
  });

  it('retrieves document by id', async () => {
    const doc = await documentRepository.getById('doc-test-1');
    expect(doc).not.toBeNull();
    expect(doc?.id).toBe('doc-test-1');
    expect(doc?.title).toBe('AC Purchase Invoice');
  });

  it('updates title and type of a document', async () => {
    await documentRepository.update('doc-test-1', {
      title: 'Tax Invoice & Extended Warranty',
      type: 'warrantyCard',
    });

    const updated = await documentRepository.getById('doc-test-1');
    expect(updated?.title).toBe('Tax Invoice & Extended Warranty');
    expect(updated?.type).toBe('warrantyCard');
  });

  it('deletes a document', async () => {
    await documentRepository.delete('doc-test-1');
    const remaining = await documentRepository.getForAsset('asset-100');
    expect(remaining).toHaveLength(0);
    expect(await documentRepository.getById('doc-test-1')).toBeNull();
  });
});
