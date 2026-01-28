/**
 * Ensure markdown starts with H1 title heading
 * Prepends "# {title}\n\n" if markdown doesn't already start with H1
 */

/**
 * Check if markdown starts with an H1 heading
 */
function startsWithH1(markdown: string): boolean {
  const trimmed = markdown.trim();
  return /^#\s+.+/.test(trimmed);
}

/**
 * Ensure markdown starts with H1 containing the article title
 * @param markdown - The markdown content
 * @param title - The article title
 * @returns Markdown with H1 title prepended if needed
 */
export function ensureTitleHeading(markdown: string, title: string): string {
  const trimmed = markdown.trim();

  // If already starts with H1, return as-is
  if (startsWithH1(trimmed)) {
    return trimmed;
  }

  // Prepend H1 with title
  return `# ${title}\n\n${trimmed}`;
}
