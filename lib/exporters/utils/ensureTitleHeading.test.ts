/**
 * Tests for ensureTitleHeading utility
 */

import { describe, it, expect } from 'vitest';
import { ensureTitleHeading } from './ensureTitleHeading';

describe('ensureTitleHeading', () => {
  it('prepends H1 when markdown has no heading', () => {
    const markdown = 'This is some content.';
    const title = 'My Article';
    const result = ensureTitleHeading(markdown, title);

    expect(result).toBe('# My Article\n\nThis is some content.');
  });

  it('prepends H1 when markdown starts with H2', () => {
    const markdown = '## Subtitle\n\nContent here.';
    const title = 'Main Title';
    const result = ensureTitleHeading(markdown, title);

    expect(result).toBe('# Main Title\n\n## Subtitle\n\nContent here.');
  });

  it('does NOT prepend H1 when markdown already starts with H1', () => {
    const markdown = '# Existing Title\n\nContent here.';
    const title = 'Different Title';
    const result = ensureTitleHeading(markdown, title);

    // Should return original markdown (already has H1)
    expect(result).toBe('# Existing Title\n\nContent here.');
  });

  it('handles markdown with leading whitespace', () => {
    const markdown = '  \n\n  Content without heading.';
    const title = 'Article Title';
    const result = ensureTitleHeading(markdown, title);

    expect(result).toBe('# Article Title\n\nContent without heading.');
  });

  it('handles empty markdown', () => {
    const markdown = '';
    const title = 'Empty Article';
    const result = ensureTitleHeading(markdown, title);

    expect(result).toBe('# Empty Article\n\n');
  });

  it('handles markdown with only whitespace', () => {
    const markdown = '   \n\n   ';
    const title = 'Whitespace Article';
    const result = ensureTitleHeading(markdown, title);

    expect(result).toBe('# Whitespace Article\n\n');
  });

  it('preserves existing H1 with special characters', () => {
    const markdown = '# Title with *emphasis* and `code`\n\nContent.';
    const title = 'New Title';
    const result = ensureTitleHeading(markdown, title);

    // Should preserve existing H1
    expect(result).toBe('# Title with *emphasis* and `code`\n\nContent.');
  });

  it('handles title with special characters', () => {
    const markdown = 'Content without heading.';
    const title = 'API & SDK: Getting Started';
    const result = ensureTitleHeading(markdown, title);

    expect(result).toBe('# API & SDK: Getting Started\n\nContent without heading.');
  });

  it('handles multiline markdown without H1', () => {
    const markdown = 'Line 1\n\nLine 2\n\nLine 3';
    const title = 'Multiline';
    const result = ensureTitleHeading(markdown, title);

    expect(result).toBe('# Multiline\n\nLine 1\n\nLine 2\n\nLine 3');
  });

  it('detects H1 with multiple spaces after #', () => {
    const markdown = '#    Lots of Spaces\n\nContent.';
    const title = 'New Title';
    const result = ensureTitleHeading(markdown, title);

    // Should recognize as existing H1
    expect(result).toBe('#    Lots of Spaces\n\nContent.');
  });

  it('handles H1 in middle of document', () => {
    const markdown = 'Some intro text.\n\n# Title in middle\n\nMore content.';
    const title = 'Prepended Title';
    const result = ensureTitleHeading(markdown, title);

    // H1 must be at START, so this should prepend
    expect(result).toBe('# Prepended Title\n\nSome intro text.\n\n# Title in middle\n\nMore content.');
  });

  it('handles glossary-style definition without term', () => {
    const markdown = 'A breakout session is a smaller group discussion.';
    const title = 'Breakout';
    const result = ensureTitleHeading(markdown, title);

    expect(result).toBe('# Breakout\n\nA breakout session is a smaller group discussion.');
  });

  it('trims leading/trailing whitespace from final output', () => {
    const markdown = '  \n\nContent here.\n\n  ';
    const title = 'Trimmed';
    const result = ensureTitleHeading(markdown, title);

    expect(result).toBe('# Trimmed\n\nContent here.');
  });
});
