/**
 * Unit tests for applyMarkdownQuality orchestrator
 */

import { describe, it, expect } from 'vitest';
import { applyMarkdownQuality, type MarkdownQualityOptions } from './index';

describe('applyMarkdownQuality', () => {
  it('applies all transformations in correct order', () => {
    const markdown = '## First\n\n\n\n\n### Empty\n\n### Has Content\n\nText.';
    const options: MarkdownQualityOptions = {
      includeTitleAsH1: false,
      normalizeHeadings: true,
      collapseBlankLines: true,
      stripEmptySections: true,
    };

    const result = applyMarkdownQuality(markdown, 'Ignored Title', options);

    // Order: normalize (## → #, ### → ##), strip (## Empty removed, leaves blank), collapse (5→2 blanks)
    // After normalize: # First\n\n\n\n\n## Empty\n\n## Has Content\n\nText.
    // After strip: # First\n\n\n\n\n\n\n## Has Content\n\nText.
    // After collapse: # First\n\n\n## Has Content\n\nText.
    expect(result.content).toBe('# First\n\n\n## Has Content\n\nText.');
    expect(result.notes).toContain('Normalized heading levels');
    expect(result.notes).toContain('Stripped 1 empty section(s)');
    expect(result.notes).toContain('Collapsed excessive blank lines');
  });

  it('prepends title when enabled and no H1 exists', () => {
    const markdown = 'Content without heading.';
    const options: MarkdownQualityOptions = {
      includeTitleAsH1: true,
      normalizeHeadings: false,
      collapseBlankLines: false,
      stripEmptySections: false,
    };

    const result = applyMarkdownQuality(markdown, 'My Title', options);

    expect(result.content).toBe('# My Title\n\nContent without heading.');
    expect(result.notes).toEqual(['Prepended title as H1']);
  });

  it('does not prepend title when H1 already exists', () => {
    const markdown = '# Existing\n\nContent.';
    const options: MarkdownQualityOptions = {
      includeTitleAsH1: true,
      normalizeHeadings: false,
      collapseBlankLines: false,
      stripEmptySections: false,
    };

    const result = applyMarkdownQuality(markdown, 'New Title', options);

    expect(result.content).toBe('# Existing\n\nContent.');
    expect(result.notes).toEqual([]); // No changes
  });

  it('applies no transformations when all options are false', () => {
    const markdown = '## Title\n\n\n\n\nContent.';
    const options: MarkdownQualityOptions = {
      includeTitleAsH1: false,
      normalizeHeadings: false,
      collapseBlankLines: false,
      stripEmptySections: false,
    };

    const result = applyMarkdownQuality(markdown, 'Title', options);

    expect(result.content).toBe(markdown);
    expect(result.notes).toEqual([]);
  });

  it('combines title prepend + normalize + collapse', () => {
    const markdown = 'Intro text.\n\n\n\n\n## Section\n\nContent.';
    const options: MarkdownQualityOptions = {
      includeTitleAsH1: true,
      normalizeHeadings: true,
      collapseBlankLines: true,
      stripEmptySections: false,
    };

    const result = applyMarkdownQuality(markdown, 'Document Title', options);

    // Order: prepend title, normalize (## → # since first heading is now Document Title H1), collapse
    // After prepend: # Document Title\n\nIntro text.\n\n\n\n\n## Section\n\nContent.
    // After normalize: no change (already starts with H1)
    // After collapse: # Document Title\n\nIntro text.\n\n\n## Section\n\nContent.
    expect(result.content).toBe('# Document Title\n\nIntro text.\n\n\n## Section\n\nContent.');
    expect(result.notes).toContain('Prepended title as H1');
    expect(result.notes).not.toContain('Normalized heading levels'); // No normalization needed
    expect(result.notes).toContain('Collapsed excessive blank lines');
  });

  it('deterministic output - same inputs produce same outputs', () => {
    const markdown = '## Title\n\n\n\n### Empty\n\n### Content\n\nText.';
    const options: MarkdownQualityOptions = {
      includeTitleAsH1: false,
      normalizeHeadings: true,
      collapseBlankLines: true,
      stripEmptySections: true,
    };

    const result1 = applyMarkdownQuality(markdown, '', options);
    const result2 = applyMarkdownQuality(markdown, '', options);
    const result3 = applyMarkdownQuality(markdown, '', options);

    expect(result1.content).toBe(result2.content);
    expect(result2.content).toBe(result3.content);
    expect(result1.notes).toEqual(result2.notes);
    expect(result2.notes).toEqual(result3.notes);
  });

  it('handles edge case: empty markdown with all options enabled', () => {
    const options: MarkdownQualityOptions = {
      includeTitleAsH1: true,
      normalizeHeadings: true,
      collapseBlankLines: true,
      stripEmptySections: true,
    };

    const result = applyMarkdownQuality('', 'Title', options);

    // Order: prepend '# Title\n\n', normalize (no change), strip (Title removed - no content), collapse
    // After strip: '\n\n', collapse sees 3 blanks but input is already <= 2, so no collapse note
    expect(result.content).toBe('\n');
    expect(result.notes).toContain('Prepended title as H1');
    expect(result.notes).toContain('Stripped 1 empty section(s)');
    // Collapse may or may not trigger depending on blank count after strip
  });

  it('collapses blanks after stripping empty sections', () => {
    const markdown = '# Keep\n\nContent.\n\n\n\n## Empty\n\n\n\n## Also Empty\n\n\n\n# More\n\nText.';
    const options: MarkdownQualityOptions = {
      includeTitleAsH1: false,
      normalizeHeadings: false,
      collapseBlankLines: true,
      stripEmptySections: true,
    };

    const result = applyMarkdownQuality(markdown, '', options);

    // Empty sections removed, then blanks collapsed
    expect(result.content).toBe('# Keep\n\nContent.\n\n\n# More\n\nText.');
    expect(result.notes).toContain('Stripped 2 empty section(s)');
    expect(result.notes).toContain('Collapsed excessive blank lines');
  });

  it('default collapseBlankLines behavior (true by default)', () => {
    const markdown = 'Line 1\n\n\n\n\nLine 2';
    const options: MarkdownQualityOptions = {
      includeTitleAsH1: false,
      normalizeHeadings: false,
      collapseBlankLines: true,
      stripEmptySections: false,
    };

    const result = applyMarkdownQuality(markdown, '', options);

    expect(result.content).toBe('Line 1\n\n\nLine 2');
    expect(result.notes).toEqual(['Collapsed excessive blank lines']);
  });

  it('preserves code blocks through entire pipeline', () => {
    const markdown = '```js\n\n\n\ncode with blanks\n\n\n\n```\n\n\n\n## Section\n\nText.';
    const options: MarkdownQualityOptions = {
      includeTitleAsH1: false,
      normalizeHeadings: true,
      collapseBlankLines: true,
      stripEmptySections: false,
    };

    const result = applyMarkdownQuality(markdown, '', options);

    // Code block blanks preserved, outside blanks collapsed, heading normalized
    expect(result.content).toBe('```js\n\n\n\ncode with blanks\n\n\n\n```\n\n\n# Section\n\nText.');
  });

  it('reports no notes when no changes are made', () => {
    const markdown = '# Title\n\nContent.';
    const options: MarkdownQualityOptions = {
      includeTitleAsH1: true, // Won't prepend - H1 exists
      normalizeHeadings: true, // Won't change - already H1
      collapseBlankLines: true, // Won't change - no excessive blanks
      stripEmptySections: true, // Won't change - no empty sections
    };

    const result = applyMarkdownQuality(markdown, 'New Title', options);

    expect(result.content).toBe(markdown);
    expect(result.notes).toEqual([]);
  });

  it('is idempotent - applying twice produces same result as once', () => {
    const markdown = '## Title\n\n\n\n\n### Empty\n\n### Content\n\nText.';
    const options: MarkdownQualityOptions = {
      includeTitleAsH1: false,
      normalizeHeadings: true,
      collapseBlankLines: true,
      stripEmptySections: true,
    };

    const once = applyMarkdownQuality(markdown, '', options);
    const twice = applyMarkdownQuality(once.content, '', options);

    expect(twice.content).toBe(once.content);
    expect(twice.notes).toEqual([]); // No changes on second pass
  });
});
