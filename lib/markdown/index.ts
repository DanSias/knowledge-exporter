/**
 * Markdown quality control utilities
 * Pure functions for improving markdown consistency
 */

import { prependTitle } from './prependTitle';
import { collapseBlankLines } from './collapseBlankLines';
import { normalizeHeadings } from './normalizeHeadings';
import { stripEmptySections } from './stripEmptySections';

export { prependTitle, collapseBlankLines, normalizeHeadings, stripEmptySections };

/**
 * Markdown quality options
 */
export interface MarkdownQualityOptions {
  includeTitleAsH1: boolean;
  normalizeHeadings: boolean;
  collapseBlankLines: boolean;
  stripEmptySections: boolean;
}

/**
 * Apply markdown quality controls in the correct order
 *
 * @param markdown - The markdown content
 * @param title - The title to prepend (if includeTitleAsH1 is true)
 * @param options - Quality control options
 * @returns Object with processed markdown and notes about transformations
 */
export function applyMarkdownQuality(
  markdown: string,
  title: string,
  options: MarkdownQualityOptions
): { content: string; notes: string[] } {
  let content = markdown;
  const notes: string[] = [];

  // 1. Prepend title as H1 (if enabled and title provided)
  if (options.includeTitleAsH1 && title) {
    const before = content;
    content = prependTitle(content, title);
    if (content !== before) {
      notes.push('Prepended title as H1');
    }
  }

  // 2. Normalize heading levels (if enabled)
  if (options.normalizeHeadings) {
    const result = normalizeHeadings(content);
    if (result.normalized) {
      content = result.content;
      notes.push('Normalized heading levels');
    }
  }

  // 3. Strip empty sections (if enabled)
  if (options.stripEmptySections) {
    const result = stripEmptySections(content);
    if (result.strippedCount > 0) {
      content = result.content;
      notes.push(`Stripped ${result.strippedCount} empty section(s)`);
    }
  }

  // 4. Collapse blank lines (if enabled) - do this last
  if (options.collapseBlankLines) {
    const before = content;
    content = collapseBlankLines(content);
    if (content !== before) {
      notes.push('Collapsed excessive blank lines');
    }
  }

  return { content, notes };
}
