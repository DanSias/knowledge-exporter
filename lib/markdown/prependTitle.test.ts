/**
 * Unit tests for prependTitle utility
 */

import { describe, it, expect } from 'vitest';
import { prependTitle } from './prependTitle';

describe('prependTitle', () => {
  it('prepends title as H1 when markdown has no headings', () => {
    const markdown = 'This is some content.\n\nMore content here.';
    const result = prependTitle(markdown, 'Article Title');
    expect(result).toBe('# Article Title\n\nThis is some content.\n\nMore content here.');
  });

  it('does not prepend when markdown already starts with H1', () => {
    const markdown = '# Existing Title\n\nContent here.';
    const result = prependTitle(markdown, 'New Title');
    expect(result).toBe('# Existing Title\n\nContent here.');
  });

  it('prepends title when markdown starts with H2 or lower', () => {
    const markdown = '## Subtitle\n\nContent here.';
    const result = prependTitle(markdown, 'Main Title');
    expect(result).toBe('# Main Title\n\n## Subtitle\n\nContent here.');
  });

  it('handles empty markdown by adding title', () => {
    const result = prependTitle('', 'Title');
    expect(result).toBe('# Title\n\n');
  });

  it('handles whitespace-only markdown', () => {
    const result = prependTitle('   \n\n  ', 'Title');
    expect(result).toBe('# Title\n\n   \n\n  ');
  });

  it('returns original markdown when title is empty', () => {
    const markdown = 'Content here.';
    expect(prependTitle(markdown, '')).toBe(markdown);
    expect(prependTitle(markdown, '   ')).toBe(markdown);
  });

  it('handles markdown with leading blank lines', () => {
    const markdown = '\n\nContent here.';
    const result = prependTitle(markdown, 'Title');
    expect(result).toBe('# Title\n\n\n\nContent here.');
  });

  it('detects H1 with trailing spaces', () => {
    const markdown = '# Existing   \n\nContent.';
    const result = prependTitle(markdown, 'New Title');
    expect(result).toBe('# Existing   \n\nContent.');
  });

  it('handles title with special characters', () => {
    const markdown = 'Content here.';
    const result = prependTitle(markdown, 'Title: API & Usage (v2.0)');
    expect(result).toBe('# Title: API & Usage (v2.0)\n\nContent here.');
  });

  it('does not prepend when H1 appears after blank lines', () => {
    const markdown = '\n\n# Title\n\nContent.';
    const result = prependTitle(markdown, 'New Title');
    expect(result).toBe('\n\n# Title\n\nContent.');
  });

  it('is idempotent - calling twice produces same result as once', () => {
    const markdown = 'Content here.';
    const once = prependTitle(markdown, 'Title');
    const twice = prependTitle(once, 'Title');
    expect(twice).toBe(once);
  });

  it('handles markdown with code blocks', () => {
    const markdown = '```js\n# Not a real heading\n```\n\nContent.';
    const result = prependTitle(markdown, 'Title');
    expect(result).toBe('# Title\n\n```js\n# Not a real heading\n```\n\nContent.');
  });
});
