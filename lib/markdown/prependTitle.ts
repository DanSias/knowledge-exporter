/**
 * Prepend title as H1 heading if not already present
 * Pure function - no side effects
 */

/**
 * Check if markdown starts with an H1 heading
 */
function startsWithH1(markdown: string): boolean {
  const trimmed = markdown.trim();
  return trimmed.startsWith('# ') || trimmed.startsWith('#\t');
}

/**
 * Prepend title as H1 heading if markdown doesn't already start with one
 *
 * @param markdown - The markdown content
 * @param title - The title to prepend
 * @returns Modified markdown with title prepended, or original if already has H1
 */
export function prependTitle(markdown: string, title: string): string {
  if (!title || !title.trim()) {
    return markdown;
  }

  if (startsWithH1(markdown)) {
    return markdown; // Already has H1, do nothing
  }

  // Prepend title as H1 with blank line separator
  return `# ${title}\n\n${markdown}`;
}
