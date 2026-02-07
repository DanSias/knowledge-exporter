/**
 * Unit tests for collapseBlankLines utility
 */

import { describe, it, expect } from 'vitest';
import { collapseBlankLines } from './collapseBlankLines';

describe('collapseBlankLines', () => {
  it('collapses 3+ blank lines to 2 blank lines', () => {
    const markdown = 'Line 1\n\n\n\nLine 2';
    const result = collapseBlankLines(markdown);
    expect(result).toBe('Line 1\n\n\nLine 2');
  });

  it('preserves 2 blank lines unchanged', () => {
    const markdown = 'Line 1\n\n\nLine 2';
    const result = collapseBlankLines(markdown);
    expect(result).toBe('Line 1\n\n\nLine 2');
  });

  it('preserves single blank line unchanged', () => {
    const markdown = 'Line 1\n\nLine 2';
    const result = collapseBlankLines(markdown);
    expect(result).toBe('Line 1\n\nLine 2');
  });

  it('preserves consecutive lines with no blanks', () => {
    const markdown = 'Line 1\nLine 2\nLine 3';
    const result = collapseBlankLines(markdown);
    expect(result).toBe('Line 1\nLine 2\nLine 3');
  });

  it('collapses multiple sections of excessive blank lines', () => {
    const markdown = 'Section 1\n\n\n\n\nSection 2\n\n\n\nSection 3';
    const result = collapseBlankLines(markdown);
    expect(result).toBe('Section 1\n\n\nSection 2\n\n\nSection 3');
  });

  it('does NOT collapse blank lines inside fenced code blocks', () => {
    const markdown = 'Before\n\n```js\nfunction test() {\n\n\n\n  return true;\n}\n```\n\nAfter';
    const result = collapseBlankLines(markdown);
    // Blank lines inside code fence should be preserved
    expect(result).toBe('Before\n\n```js\nfunction test() {\n\n\n\n  return true;\n}\n```\n\nAfter');
  });

  it('collapses blank lines even in indented code blocks (limitation)', () => {
    const markdown = 'Before\n\n    code line 1\n\n\n\n    code line 2\n\nAfter';
    const result = collapseBlankLines(markdown);
    // Current implementation doesn't detect indented code blocks, only fenced
    expect(result).toBe('Before\n\n    code line 1\n\n\n    code line 2\n\nAfter');
  });

  it('handles very long sequences of blank lines', () => {
    const markdown = 'Start\n' + '\n'.repeat(20) + 'End';
    const result = collapseBlankLines(markdown);
    expect(result).toBe('Start\n\n\nEnd');
  });

  it('handles empty string', () => {
    expect(collapseBlankLines('')).toBe('');
  });

  it('handles string with only blank lines', () => {
    const markdown = '\n\n\n\n\n';
    const result = collapseBlankLines(markdown);
    // Input splits to 6 empty strings, all are "blank", first 2 kept -> '\n'
    expect(result).toBe('\n');
  });

  it('preserves trailing blank lines (collapsed to max 2)', () => {
    const markdown = 'Content\n\n\n\n\n';
    const result = collapseBlankLines(markdown);
    // After 'Content', 5 empty strings, first 2 kept -> 'Content\n\n'
    expect(result).toBe('Content\n\n');
  });

  it('preserves leading blank lines (collapsed to max 2)', () => {
    const markdown = '\n\n\n\n\nContent';
    const result = collapseBlankLines(markdown);
    // 5 leading empty strings (blank), then 'Content', first 2 blanks kept -> '\n\nContent'
    expect(result).toBe('\n\nContent');
  });

  it('handles multiple fenced code blocks', () => {
    const markdown = '```\ncode\n\n\n\nmore\n```\n\n\n\nText\n\n\n\n```\ncode2\n\n\n\nmore2\n```';
    const result = collapseBlankLines(markdown);
    // Blanks inside code blocks preserved, blanks outside collapsed
    expect(result).toBe('```\ncode\n\n\n\nmore\n```\n\n\nText\n\n\n```\ncode2\n\n\n\nmore2\n```');
  });

  it('handles code fences with language specifiers', () => {
    const markdown = '```typescript\nconst x = 1;\n\n\n\n\nconst y = 2;\n```\n\n\n\nAfter';
    const result = collapseBlankLines(markdown);
    expect(result).toBe('```typescript\nconst x = 1;\n\n\n\n\nconst y = 2;\n```\n\n\nAfter');
  });

  it('is idempotent - calling twice produces same result as once', () => {
    const markdown = 'Line 1\n\n\n\n\n\nLine 2';
    const once = collapseBlankLines(markdown);
    const twice = collapseBlankLines(once);
    expect(twice).toBe(once);
    expect(once).toBe('Line 1\n\n\nLine 2');
  });
});
