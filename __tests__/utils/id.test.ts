import { generateId } from '../../src/utils/id';

describe('generateId', () => {
  it('generates an ID with default prefix "av"', () => {
    const id = generateId();
    expect(id).toMatch(/^av-[a-z0-9]+-[a-z0-9]+$/);
  });

  it('generates an ID with custom prefix', () => {
    const id = generateId('ast');
    expect(id.startsWith('ast-')).toBe(true);
  });

  it('generates unique IDs across multiple invocations', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 50; i++) {
      ids.add(generateId('test'));
    }
    expect(ids.size).toBe(50);
  });
});
