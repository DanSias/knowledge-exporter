/**
 * Collapse excessive blank lines to a maximum of 2
 * Preserves code blocks (fenced and indented)
 * Pure function - no side effects
 */

/**
 * Collapse multiple consecutive blank lines to maximum of 2
 *
 * @param markdown - The markdown content
 * @returns Modified markdown with collapsed blank lines
 */
export function collapseBlankLines(markdown: string): string {
  const lines = markdown.split('\n');
  const result: string[] = [];
  let consecutiveBlankLines = 0;
  let inFencedCodeBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isBlank = line.trim() === '';

    // Track fenced code blocks
    if (line.trim().startsWith('```') || line.trim().startsWith('~~~')) {
      inFencedCodeBlock = !inFencedCodeBlock;
      result.push(line);
      consecutiveBlankLines = 0;
      continue;
    }

    // Inside code blocks: preserve all blank lines
    if (inFencedCodeBlock) {
      result.push(line);
      continue;
    }

    // Outside code blocks: collapse blank lines
    if (isBlank) {
      consecutiveBlankLines++;
      if (consecutiveBlankLines <= 2) {
        result.push(line);
      }
      // Skip if more than 2 consecutive blank lines
    } else {
      result.push(line);
      consecutiveBlankLines = 0;
    }
  }

  return result.join('\n');
}
