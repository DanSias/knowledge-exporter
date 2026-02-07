/**
 * Normalize heading levels to ensure consistent hierarchy
 * Pure function - no side effects
 */

interface HeadingInfo {
  lineIndex: number;
  level: number;
  text: string;
}

/**
 * Parse heading level from markdown line
 * Returns 0 if not a heading
 */
function getHeadingLevel(line: string): number {
  const trimmed = line.trimStart();
  const match = trimmed.match(/^(#{1,6})\s/);
  return match ? match[1].length : 0;
}

/**
 * Extract all headings from markdown
 */
function extractHeadings(lines: string[]): HeadingInfo[] {
  const headings: HeadingInfo[] = [];
  let inFencedCodeBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Track code blocks
    if (line.trim().startsWith('```') || line.trim().startsWith('~~~')) {
      inFencedCodeBlock = !inFencedCodeBlock;
      continue;
    }

    if (inFencedCodeBlock) continue;

    const level = getHeadingLevel(line);
    if (level > 0) {
      const text = line.trimStart().replace(/^#{1,6}\s+/, '');
      headings.push({ lineIndex: i, level, text });
    }
  }

  return headings;
}

/**
 * Normalize heading levels to ensure first heading is H1 and subsequent headings increment consistently
 *
 * @param markdown - The markdown content
 * @returns Object with normalized markdown and success flag
 */
export function normalizeHeadings(markdown: string): { content: string; normalized: boolean } {
  const lines = markdown.split('\n');
  const headings = extractHeadings(lines);

  if (headings.length === 0) {
    return { content: markdown, normalized: false }; // No headings to normalize
  }

  // Find the minimum heading level (should become H1)
  const minLevel = Math.min(...headings.map((h) => h.level));

  if (minLevel === 1) {
    // Already starts at H1, check if hierarchy is consistent
    let isConsistent = true;
    for (let i = 1; i < headings.length; i++) {
      const prevLevel = headings[i - 1].level;
      const currLevel = headings[i].level;
      // Allow level to stay same, go up 1, or go down (back to parent)
      if (currLevel > prevLevel + 1) {
        isConsistent = false;
        break;
      }
    }

    if (isConsistent) {
      return { content: markdown, normalized: false }; // Already normalized
    }
  }

  // Adjust all heading levels
  const adjustment = 1 - minLevel; // How much to shift levels
  const result = [...lines];

  for (const heading of headings) {
    const newLevel = heading.level + adjustment;
    if (newLevel < 1 || newLevel > 6) {
      // Cannot normalize safely (would exceed valid range)
      return { content: markdown, normalized: false };
    }

    const hashes = '#'.repeat(newLevel);
    result[heading.lineIndex] = `${hashes} ${heading.text}`;
  }

  return { content: result.join('\n'), normalized: true };
}
