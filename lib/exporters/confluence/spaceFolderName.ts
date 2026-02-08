/**
 * Generate friendly folder names for Confluence spaces
 * Uses space.name (slugified) instead of ugly space.key
 */

import { slugify } from '../utils/slugify';

/**
 * Generate a deterministic folder name for a Confluence space
 *
 * @param spaceName - The human-readable space name (e.g., "dansias", "Documentation")
 * @param spaceKey - The Confluence space key (e.g., "~7120...", "DOC")
 * @param allSpaceNames - All space names to check for collisions (optional)
 * @returns Slugified folder name with collision suffix if needed
 *
 * @example
 * // Global space
 * getSpaceFolderName("Documentation", "DOC") // => "documentation"
 *
 * @example
 * // Personal space
 * getSpaceFolderName("dansias", "~712020ace2770e28a94fecacac2555c8ec06e1") // => "dansias"
 *
 * @example
 * // Collision case
 * getSpaceFolderName("My Space", "ABC", ["my-space"]) // => "my-space--abc"
 */
export function getSpaceFolderName(
  spaceName: string,
  spaceKey: string,
  allSpaceNames: string[] = []
): string {
  const baseSlug = slugify(spaceName);

  // Check if this slug is unique
  const hasCollision = allSpaceNames.filter(name => slugify(name) === baseSlug).length > 1;

  if (!hasCollision) {
    return baseSlug;
  }

  // Collision detected - add stable suffix from spaceKey
  const sanitizedKey = sanitizeSpaceKey(spaceKey);
  const shortKey = sanitizedKey.substring(0, 8).toLowerCase();

  return `${baseSlug}--${shortKey}`;
}

/**
 * Sanitize a Confluence space key for use in folder names
 * Removes special characters like ~ and hashes
 */
function sanitizeSpaceKey(spaceKey: string): string {
  // Remove leading ~ from personal space keys
  let sanitized = spaceKey.replace(/^~/, '');

  // Keep only alphanumeric characters
  sanitized = sanitized.replace(/[^a-zA-Z0-9]/g, '');

  return sanitized;
}

/**
 * Build a map of space keys to folder names for all spaces in an export
 * Handles collision detection and ensures deterministic naming
 *
 * @param spaces - Array of spaces with id, key, and name
 * @returns Map of spaceKey -> folderName
 */
export function buildSpaceFolderMap(
  spaces: Array<{ id: string | number; key: string; name: string }>
): Map<string, string> {
  const folderMap = new Map<string, string>();
  const allNames = spaces.map(s => s.name);

  for (const space of spaces) {
    const folderName = getSpaceFolderName(space.name, space.key, allNames);
    folderMap.set(space.key, folderName);
  }

  return folderMap;
}
