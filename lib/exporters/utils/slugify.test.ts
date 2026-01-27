/**
 * Unit tests for slugify utilities
 */

import { describe, it, expect } from 'vitest';
import { slugify, makeUniqueSlug } from './slugify';

describe('slugify', () => {
  it('converts text to lowercase', () => {
    expect(slugify('Hello World')).toBe('hello-world');
    expect(slugify('UPPERCASE TEXT')).toBe('uppercase-text');
  });

  it('replaces spaces with hyphens', () => {
    expect(slugify('hello world test')).toBe('hello-world-test');
    expect(slugify('multiple   spaces')).toBe('multiple-spaces');
  });

  it('replaces underscores with hyphens', () => {
    expect(slugify('hello_world_test')).toBe('hello-world-test');
  });

  it('removes invalid filename characters', () => {
    expect(slugify('hello<world')).toBe('hello-world');
    expect(slugify('test>file')).toBe('test-file');
    expect(slugify('file:name')).toBe('file-name');
    expect(slugify('path/to/file')).toBe('path-to-file');
    expect(slugify('back\\slash')).toBe('back-slash');
    expect(slugify('pipe|char')).toBe('pipe-char');
    expect(slugify('question?mark')).toBe('question-mark');
    expect(slugify('asterisk*char')).toBe('asterisk-char');
  });

  it('removes consecutive hyphens', () => {
    expect(slugify('hello---world')).toBe('hello-world');
    expect(slugify('test--file')).toBe('test-file');
  });

  it('removes leading and trailing hyphens', () => {
    expect(slugify('-hello-world-')).toBe('hello-world');
    expect(slugify('---test---')).toBe('test');
  });

  it('handles Windows reserved names', () => {
    expect(slugify('con')).toBe('con-file');
    expect(slugify('CON')).toBe('con-file');
    expect(slugify('prn')).toBe('prn-file');
    expect(slugify('aux')).toBe('aux-file');
    expect(slugify('nul')).toBe('nul-file');
    expect(slugify('com1')).toBe('com1-file');
    expect(slugify('lpt1')).toBe('lpt1-file');
  });

  it('handles empty or whitespace-only input', () => {
    expect(slugify('')).toBe('untitled');
    expect(slugify('   ')).toBe('untitled');
  });

  it('handles non-ASCII characters', () => {
    expect(slugify('café')).toBe('caf');
    expect(slugify('naïve')).toBe('na-ve');
  });

  it('limits length to 200 characters', () => {
    const longText = 'a'.repeat(300);
    const result = slugify(longText);
    expect(result.length).toBeLessThanOrEqual(200);
  });

  it('is deterministic - same input produces same output', () => {
    const input = 'Test Article Title 123';
    const result1 = slugify(input);
    const result2 = slugify(input);
    const result3 = slugify(input);

    expect(result1).toBe(result2);
    expect(result2).toBe(result3);
    expect(result1).toBe('test-article-title-123');
  });

  it('handles special characters and numbers', () => {
    expect(slugify('Version 2.0 (beta)')).toBe('version-2-0-beta');
    expect(slugify('Test #1: Success!')).toBe('test-1-success');
  });
});

describe('makeUniqueSlug', () => {
  it('returns base slug if not in existing set', () => {
    const existing = new Set(['other-slug', 'another-slug']);
    expect(makeUniqueSlug('test-slug', existing)).toBe('test-slug');
  });

  it('appends -2 for first collision', () => {
    const existing = new Set(['test-slug']);
    expect(makeUniqueSlug('test-slug', existing)).toBe('test-slug-2');
  });

  it('finds next available number for multiple collisions', () => {
    const existing = new Set(['test-slug', 'test-slug-2', 'test-slug-3']);
    expect(makeUniqueSlug('test-slug', existing)).toBe('test-slug-4');
  });

  it('handles gaps in numbering', () => {
    const existing = new Set(['test-slug', 'test-slug-2', 'test-slug-4']);
    // Should use -3 (fills the gap)
    // Actually, it finds next available, which is -3
    const result = makeUniqueSlug('test-slug', existing);
    expect(result).toBe('test-slug-3');
  });

  it('works with empty set', () => {
    const existing = new Set<string>();
    expect(makeUniqueSlug('test-slug', existing)).toBe('test-slug');
  });

  it('is deterministic with same inputs', () => {
    const existing = new Set(['test-slug', 'test-slug-2']);
    const result1 = makeUniqueSlug('test-slug', existing);
    const result2 = makeUniqueSlug('test-slug', existing);

    expect(result1).toBe(result2);
    expect(result1).toBe('test-slug-3');
  });
});
