/**
 * Generates a unique ID for assets and related records.
 * Uses timestamp + random suffix for uniqueness without external deps.
 */
export function generateId(prefix: string = 'av'): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${timestamp}-${random}`;
}
