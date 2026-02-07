/**
 * Unit tests for stripEmptySections utility
 */

import { describe, it, expect } from 'vitest';
import { stripEmptySections } from './stripEmptySections';

describe('stripEmptySections', () => {
  it('removes heading with no content after it', () => {
    const markdown = '# Title\n\n## Empty Section\n\n## Section with Content\n\nSome text.';
    const result = stripEmptySections(markdown);
    // Removing "## Empty Section" line, blank line before it remains
    expect(result.content).toBe('# Title\n\n\n## Section with Content\n\nSome text.');
    expect(result.strippedCount).toBe(1);
  });

  it('preserves heading with text content', () => {
    const markdown = '# Title\n\nContent here.';
    const result = stripEmptySections(markdown);
    expect(result.content).toBe(markdown);
    expect(result.strippedCount).toBe(0);
  });

  it('preserves heading with subheadings', () => {
    const markdown = '# Title\n\n## Subtitle\n\nContent.';
    const result = stripEmptySections(markdown);
    expect(result.content).toBe(markdown);
    expect(result.strippedCount).toBe(0);
  });

  it('removes multiple empty headings at same level', () => {
    const markdown = '# Empty 1\n\n# Empty 2\n\n# Has Content\n\nText.';
    const result = stripEmptySections(markdown);
    // Removing indices 0 and 2, leaves indices 1,3,4,5,6
    expect(result.content).toBe('\n\n# Has Content\n\nText.');
    expect(result.strippedCount).toBe(2);
  });

  it('handles trailing empty heading', () => {
    const markdown = '# Content\n\nText here.\n\n## Empty Trailing';
    const result = stripEmptySections(markdown);
    // Input: ['# Content', '', 'Text here.', '', '## Empty Trailing']
    // Remove index 4: ['# Content', '', 'Text here.', '']
    expect(result.content).toBe('# Content\n\nText here.\n');
    expect(result.strippedCount).toBe(1);
  });

  it('does not strip heading with subheadings even if no text content', () => {
    const markdown = '# Title\n\n   \n\n## Next Section\n\nContent.';
    const result = stripEmptySections(markdown);
    // "# Title" has subheading "## Next Section", so it's NOT removed
    expect(result.content).toBe('# Title\n\n   \n\n## Next Section\n\nContent.');
    expect(result.strippedCount).toBe(0);
  });

  it('preserves heading with list content', () => {
    const markdown = '# Title\n\n- Item 1\n- Item 2';
    const result = stripEmptySections(markdown);
    expect(result.content).toBe(markdown);
    expect(result.strippedCount).toBe(0);
  });

  it('preserves heading with code block', () => {
    const markdown = '# Code Section\n\n```js\ncode here\n```';
    const result = stripEmptySections(markdown);
    expect(result.content).toBe(markdown);
    expect(result.strippedCount).toBe(0);
  });

  it('handles nested empty sections', () => {
    const markdown = '# Main\n\n## Sub1\n\n### Empty\n\n## Sub2\n\nContent.';
    const result = stripEmptySections(markdown);
    // "## Sub1" has subheading "### Empty", so Sub1 is preserved
    // "### Empty" has no content and no subheadings, so it's removed (index 4)
    expect(result.content).toBe('# Main\n\n## Sub1\n\n\n## Sub2\n\nContent.');
    expect(result.strippedCount).toBe(1); // Only ### Empty
  });

  it('handles markdown with no headings', () => {
    const markdown = 'Just plain text.\n\nNo headings here.';
    const result = stripEmptySections(markdown);
    expect(result.content).toBe(markdown);
    expect(result.strippedCount).toBe(0);
  });

  it('handles empty string', () => {
    const result = stripEmptySections('');
    expect(result.content).toBe('');
    expect(result.strippedCount).toBe(0);
  });

  it('preserves heading followed by blockquote', () => {
    const markdown = '# Quote Section\n\n> This is a quote.';
    const result = stripEmptySections(markdown);
    expect(result.content).toBe(markdown);
    expect(result.strippedCount).toBe(0);
  });

  it('preserves heading followed by horizontal rule', () => {
    const markdown = '# Section\n\n---';
    const result = stripEmptySections(markdown);
    expect(result.content).toBe(markdown);
    expect(result.strippedCount).toBe(0);
  });

  it('does not remove heading that has subheadings (even with no content)', () => {
    const markdown = '# Empty\n\n\n\n## Next\n\nContent.';
    const result = stripEmptySections(markdown);
    // "# Empty" has a subheading "## Next", so it's NOT removed
    expect(result.content).toBe('# Empty\n\n\n\n## Next\n\nContent.');
    expect(result.strippedCount).toBe(0);
  });

  it('is idempotent - calling twice produces same result as once', () => {
    const markdown = '# Empty 1\n\n# Empty 2\n\n# Has Content\n\nText.';
    const once = stripEmptySections(markdown);
    const twice = stripEmptySections(once.content);
    expect(twice.content).toBe(once.content);
    expect(twice.strippedCount).toBe(0); // Nothing left to strip
    expect(once.strippedCount).toBe(2);
  });

  it('preserves heading with table content', () => {
    const markdown = '# Table\n\n| Col1 | Col2 |\n|------|------|\n| A    | B    |';
    const result = stripEmptySections(markdown);
    expect(result.content).toBe(markdown);
    expect(result.strippedCount).toBe(0);
  });
});
