/**
 * Content hashing utilities for idempotent exports
 */

import crypto from 'crypto';

/**
 * Generate a stable hash of content for comparison
 * Uses SHA-256 for consistency
 */
export function hashContent(content: string): string {
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

/**
 * Compare two content strings by hash
 */
export function contentUnchanged(oldContent: string, newContent: string): boolean {
  return hashContent(oldContent) === hashContent(newContent);
}
