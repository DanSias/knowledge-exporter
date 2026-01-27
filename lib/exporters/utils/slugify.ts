/**
 * Deterministic, Windows-safe slug generation
 */

/**
 * Convert a string to a filesystem-safe slug
 * - Deterministic: same input always produces same output
 * - Windows-safe: no reserved characters or names
 * - Collision handling: appends numeric suffix if needed
 */
export function slugify(text: string): string {
  if (!text) return 'untitled';

  let slug = text
    .toLowerCase()
    .trim()
    // Replace spaces and underscores with hyphens
    .replace(/[\s_]+/g, '-')
    // Replace invalid filename characters with hyphens (Windows + Unix)
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '-')
    // Replace other non-alphanumeric characters with hyphens
    .replace(/[^a-z0-9-]/g, '-')
    // Remove consecutive hyphens
    .replace(/-+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '');

  // Handle empty result
  if (!slug) return 'untitled';

  // Windows reserved names (case-insensitive)
  const windowsReserved = new Set([
    'con', 'prn', 'aux', 'nul',
    'com1', 'com2', 'com3', 'com4', 'com5', 'com6', 'com7', 'com8', 'com9',
    'lpt1', 'lpt2', 'lpt3', 'lpt4', 'lpt5', 'lpt6', 'lpt7', 'lpt8', 'lpt9',
  ]);

  if (windowsReserved.has(slug)) {
    slug = `${slug}-file`;
  }

  // Limit length (Windows MAX_PATH is 260, leave room for path)
  if (slug.length > 200) {
    slug = slug.substring(0, 200).replace(/-+$/, '');
  }

  return slug;
}

/**
 * Generate a unique slug by appending a numeric suffix if collision detected
 */
export function makeUniqueSlug(
  baseSlug: string,
  existingSlugs: Set<string>
): string {
  if (!existingSlugs.has(baseSlug)) {
    return baseSlug;
  }

  // Find next available number
  let counter = 2;
  let uniqueSlug = `${baseSlug}-${counter}`;

  while (existingSlugs.has(uniqueSlug)) {
    counter++;
    uniqueSlug = `${baseSlug}-${counter}`;
  }

  return uniqueSlug;
}
