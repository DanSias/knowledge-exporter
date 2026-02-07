/**
 * Unit tests for normalizeHeadings utility
 */

import { describe, it, expect } from 'vitest';
import { normalizeHeadings } from './normalizeHeadings';

describe('normalizeHeadings', () => {
  it('promotes first H2 to H1 and adjusts subsequent headings', () => {
    const markdown = '## First Heading\n\nContent.\n\n### Subheading';
    const result = normalizeHeadings(markdown);
    expect(result.content).toBe('# First Heading\n\nContent.\n\n## Subheading');
    expect(result.normalized).toBe(true);
  });

  it('leaves content unchanged when first heading is already H1', () => {
    const markdown = '# Title\n\n## Subtitle\n\n### Section';
    const result = normalizeHeadings(markdown);
    expect(result.content).toBe(markdown);
    expect(result.normalized).toBe(false);
  });

  it('promotes H3 to H1 when it is the first heading', () => {
    const markdown = 'Intro text.\n\n### First Heading\n\n#### Subsection';
    const result = normalizeHeadings(markdown);
    expect(result.content).toBe('Intro text.\n\n# First Heading\n\n## Subsection');
    expect(result.normalized).toBe(true);
  });

  it('normalizes deeply nested headings', () => {
    const markdown = '#### Deep Heading\n\n##### Deeper\n\n###### Deepest';
    const result = normalizeHeadings(markdown);
    expect(result.content).toBe('# Deep Heading\n\n## Deeper\n\n### Deepest');
    expect(result.normalized).toBe(true);
  });

  it('handles content with no headings', () => {
    const markdown = 'Just some text.\n\nNo headings here.';
    const result = normalizeHeadings(markdown);
    expect(result.content).toBe(markdown);
    expect(result.normalized).toBe(false);
  });

  it('does not invent headings when none exist', () => {
    const markdown = 'Plain text document.\n\nMore content.';
    const result = normalizeHeadings(markdown);
    expect(result.content).toBe(markdown);
    expect(result.normalized).toBe(false);
  });

  it('ignores headings inside code blocks', () => {
    const markdown = '```\n## Not a heading\n```\n\n## Real Heading';
    const result = normalizeHeadings(markdown);
    expect(result.content).toBe('```\n## Not a heading\n```\n\n# Real Heading');
    expect(result.normalized).toBe(true);
  });

  it('handles mixed heading levels by shifting minimum to H1', () => {
    const markdown = '### Title\n\n## Subtitle\n\n#### Section\n\n## Another';
    const result = normalizeHeadings(markdown);
    // Min level is 2 (##), adjustment = 1 - 2 = -1
    // ### (3) → ## (2), ## (2) → # (1), #### (4) → ### (3), ## (2) → # (1)
    expect(result.content).toBe('## Title\n\n# Subtitle\n\n### Section\n\n# Another');
    expect(result.normalized).toBe(true);
  });

  it('handles headings with trailing whitespace', () => {
    const markdown = '## Title   \n\nContent.';
    const result = normalizeHeadings(markdown);
    expect(result.content).toBe('# Title   \n\nContent.');
    expect(result.normalized).toBe(true);
  });

  it('handles headings with inline formatting', () => {
    const markdown = '## **Bold** Title\n\n### *Italic* Subtitle';
    const result = normalizeHeadings(markdown);
    expect(result.content).toBe('# **Bold** Title\n\n## *Italic* Subtitle');
    expect(result.normalized).toBe(true);
  });

  it('handles ATX-style headings with closing hashes', () => {
    const markdown = '## Title ##\n\n### Subtitle ###';
    const result = normalizeHeadings(markdown);
    expect(result.content).toBe('# Title ##\n\n## Subtitle ###');
    expect(result.normalized).toBe(true);
  });

  it('preserves content before first heading', () => {
    const markdown = 'Introduction paragraph.\n\nMore intro.\n\n## First Heading\n\nContent.';
    const result = normalizeHeadings(markdown);
    expect(result.content).toBe('Introduction paragraph.\n\nMore intro.\n\n# First Heading\n\nContent.');
    expect(result.normalized).toBe(true);
  });

  it('is idempotent - calling twice produces same result as once', () => {
    const markdown = '## Title\n\n### Subtitle';
    const once = normalizeHeadings(markdown);
    const twice = normalizeHeadings(once.content);
    expect(twice.content).toBe(once.content);
    expect(twice.normalized).toBe(false); // Already normalized
  });

  it('handles empty string', () => {
    const result = normalizeHeadings('');
    expect(result.content).toBe('');
    expect(result.normalized).toBe(false);
  });

  it('handles very deep nesting (H6)', () => {
    const markdown = '###### Deep\n\nContent.';
    const result = normalizeHeadings(markdown);
    expect(result.content).toBe('# Deep\n\nContent.');
    expect(result.normalized).toBe(true);
  });
});
