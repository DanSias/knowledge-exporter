/**
 * Strip empty sections (headings with no content under them)
 * Pure function - no side effects
 */

interface Section {
  headingIndex: number;
  headingLevel: number;
  contentLines: number[]; // Line indices of content under this heading
  hasSubheadings: boolean;
}

/**
 * Parse heading level from markdown line
 */
function getHeadingLevel(line: string): number {
  const trimmed = line.trimStart();
  const match = trimmed.match(/^(#{1,6})\s/);
  return match ? match[1].length : 0;
}

/**
 * Check if a line has meaningful content (not just whitespace)
 */
function hasContent(line: string): boolean {
  return line.trim().length > 0;
}

/**
 * Build section map from markdown
 */
function buildSections(lines: string[]): Section[] {
  const sections: Section[] = [];
  let currentSection: Section | null = null;
  let inFencedCodeBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Track code blocks
    if (line.trim().startsWith('```') || line.trim().startsWith('~~~')) {
      inFencedCodeBlock = !inFencedCodeBlock;
      if (currentSection && hasContent(line)) {
        currentSection.contentLines.push(i);
      }
      continue;
    }

    const level = getHeadingLevel(line);

    if (level > 0 && !inFencedCodeBlock) {
      // Found a heading
      if (currentSection) {
        sections.push(currentSection);
      }

      currentSection = {
        headingIndex: i,
        headingLevel: level,
        contentLines: [],
        hasSubheadings: false,
      };
    } else if (currentSection) {
      // Add to current section
      if (hasContent(line)) {
        currentSection.contentLines.push(i);
      }
    }
  }

  // Push final section
  if (currentSection) {
    sections.push(currentSection);
  }

  // Mark sections that have subheadings
  for (let i = 0; i < sections.length; i++) {
    for (let j = i + 1; j < sections.length; j++) {
      if (sections[j].headingLevel > sections[i].headingLevel) {
        sections[i].hasSubheadings = true;
      } else {
        break; // End of subsections
      }
    }
  }

  return sections;
}

/**
 * Strip headings that have no content under them
 * Preserves headings that contain subheadings or lists
 *
 * @param markdown - The markdown content
 * @returns Object with modified markdown and count of stripped sections
 */
export function stripEmptySections(markdown: string): {
  content: string;
  strippedCount: number;
} {
  const lines = markdown.split('\n');
  const sections = buildSections(lines);

  if (sections.length === 0) {
    return { content: markdown, strippedCount: 0 };
  }

  const linesToRemove = new Set<number>();

  for (const section of sections) {
    // Keep heading if it has content OR subheadings
    const isEmpty = section.contentLines.length === 0 && !section.hasSubheadings;

    if (isEmpty) {
      linesToRemove.add(section.headingIndex);
    }
  }

  if (linesToRemove.size === 0) {
    return { content: markdown, strippedCount: 0 };
  }

  // Filter out empty headings
  const result = lines.filter((_, idx) => !linesToRemove.has(idx));

  return {
    content: result.join('\n'),
    strippedCount: linesToRemove.size,
  };
}
