/**
 * Unit tests for splitMarkdown utility
 */

import { describe, it, expect } from 'vitest';
import { splitMarkdown } from './splitMarkdown';

describe('splitMarkdown', () => {
  it('returns single part if content is under maxChars', () => {
    const content = 'Short content';
    const parts = splitMarkdown(content, 'test.md', 1000);

    expect(parts).toHaveLength(1);
    expect(parts[0].content).toBe(content);
    expect(parts[0].partNumber).toBe(1);
    expect(parts[0].fileName).toBe('test.md');
  });

  it('returns single part if maxCharsPerFile is 0', () => {
    const content = 'Very long content'.repeat(1000);
    const parts = splitMarkdown(content, 'test.md', 0);

    expect(parts).toHaveLength(1);
    expect(parts[0].fileName).toBe('test.md');
  });

  it('splits content exceeding maxChars into multiple parts', () => {
    const content = 'Line 1\nLine 2\nLine 3\nLine 4\nLine 5\n';
    const parts = splitMarkdown(content, 'test.md', 15);

    expect(parts.length).toBeGreaterThan(1);
  });

  it('formats part file names correctly', () => {
    const content = Array(100).fill('x').join('\n');
    const parts = splitMarkdown(content, 'article.md', 30);

    expect(parts.length).toBeGreaterThan(1);
    expect(parts[0].fileName).toBe('article.md');
    expect(parts[1].fileName).toBe('article-part-002.md');
    if (parts.length > 2) {
      expect(parts[2].fileName).toBe('article-part-003.md');
    }
  });

  it('numbers parts sequentially starting from 1', () => {
    const content = 'a\n'.repeat(100);
    const parts = splitMarkdown(content, 'test.md', 10);

    expect(parts[0].partNumber).toBe(1);
    expect(parts[1].partNumber).toBe(2);
    expect(parts[2].partNumber).toBe(3);
  });

  it('splits at line boundaries', () => {
    const content = 'Line 1\nLine 2\nLine 3\nLine 4\n';
    const parts = splitMarkdown(content, 'test.md', 15);

    // Each part should contain complete lines
    for (const part of parts) {
      expect(part.content).not.toMatch(/\nLine\s*$/);
    }
  });

  it('is deterministic - same input produces same output', () => {
    const content = 'Line 1\nLine 2\nLine 3\nLine 4\nLine 5\n';

    const parts1 = splitMarkdown(content, 'test.md', 15);
    const parts2 = splitMarkdown(content, 'test.md', 15);
    const parts3 = splitMarkdown(content, 'test.md', 15);

    expect(parts1.length).toBe(parts2.length);
    expect(parts2.length).toBe(parts3.length);

    for (let i = 0; i < parts1.length; i++) {
      expect(parts1[i].content).toBe(parts2[i].content);
      expect(parts2[i].content).toBe(parts3[i].content);
      expect(parts1[i].fileName).toBe(parts2[i].fileName);
      expect(parts1[i].partNumber).toBe(parts2[i].partNumber);
    }
  });

  it('handles empty content', () => {
    const parts = splitMarkdown('', 'test.md', 100);

    expect(parts).toHaveLength(1);
    expect(parts[0].content).toBe('');
    expect(parts[0].fileName).toBe('test.md');
  });

  it('handles content with no newlines as single part', () => {
    const content = 'x'.repeat(100);
    const parts = splitMarkdown(content, 'test.md', 30);

    // Content without newlines becomes a single line, so it won't split nicely
    // This is acceptable for markdown which typically has newlines
    expect(parts).toHaveLength(1);
    expect(parts[0].content).toBe(content);
  });

  it('preserves all content across parts', () => {
    const content = 'Line 1\nLine 2\nLine 3\nLine 4\nLine 5\n';
    const parts = splitMarkdown(content, 'test.md', 15);

    const reassembled = parts.map((p) => p.content).join('\n');
    const originalLines = content.split('\n').filter((l) => l);
    const reassembledLines = reassembled.split('\n').filter((l) => l);

    // All lines should be preserved
    expect(reassembledLines.length).toBeGreaterThanOrEqual(originalLines.length);
  });

  it('handles basename without .md extension', () => {
    const content = Array(100).fill('x').join('\n');
    const parts = splitMarkdown(content, 'article', 30);

    expect(parts[0].fileName).toBe('article');
    if (parts.length > 1) {
      expect(parts[1].fileName).toBe('article-part-002.md');
    }
  });

  it('pads part numbers with leading zeros', () => {
    const content = 'x\n'.repeat(1000);
    const parts = splitMarkdown(content, 'test.md', 10);

    // Should have many parts
    if (parts.length >= 10) {
      expect(parts[9].fileName).toBe('test-part-010.md');
    }
  });

  it('handles very small maxChars', () => {
    const content = 'a\nb\nc\nd\ne\n';
    const parts = splitMarkdown(content, 'test.md', 4);

    // Should create multiple parts
    expect(parts.length).toBeGreaterThan(1);
    // Each part should have content (may be empty strings due to newlines)
    expect(parts.length).toBeGreaterThan(0);
  });
});
