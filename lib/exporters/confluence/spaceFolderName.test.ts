/**
 * Unit tests for spaceFolderName
 */

import { describe, it, expect } from 'vitest';
import { getSpaceFolderName, buildSpaceFolderMap } from './spaceFolderName';

describe('getSpaceFolderName', () => {
  it('generates slug from global space name', () => {
    const result = getSpaceFolderName('Documentation', 'DOC');
    expect(result).toBe('documentation');
  });

  it('generates slug from personal space name', () => {
    const result = getSpaceFolderName('dansias', '~712020ace2770e28a94fecacac2555c8ec06e1');
    expect(result).toBe('dansias');
  });

  it('handles spaces with special characters', () => {
    const result = getSpaceFolderName('My Project: Phase 1', 'MP1');
    expect(result).toBe('my-project-phase-1');
  });

  it('handles collision by appending short key', () => {
    const allNames = ['My Space', 'My Space']; // Two spaces with same name
    const result1 = getSpaceFolderName('My Space', 'ABC123XYZ', allNames);
    const result2 = getSpaceFolderName('My Space', 'DEF456UVW', allNames);

    expect(result1).toBe('my-space--abc123xy');
    expect(result2).toBe('my-space--def456uv');
    expect(result1).not.toBe(result2); // Different suffixes
  });

  it('handles personal space key collision', () => {
    const allNames = ['dansias', 'dansias']; // Two users with same name
    const result1 = getSpaceFolderName('dansias', '~712020ace2770e28a94fecacac2555c8ec06e1', allNames);
    const result2 = getSpaceFolderName('dansias', '~812030bdf3881f39b05gedcbdbd3666d9fd17f2', allNames);

    expect(result1).toBe('dansias--712020ac');
    expect(result2).toBe('dansias--812030bd');
    expect(result1).not.toBe(result2);
  });

  it('removes tilde from personal space key suffix', () => {
    const allNames = ['test', 'test'];
    const result = getSpaceFolderName('test', '~abc123', allNames);
    expect(result).toBe('test--abc123');
    expect(result).not.toContain('~');
  });

  it('uses only first 8 chars of sanitized key for suffix', () => {
    const allNames = ['docs', 'docs'];
    const result = getSpaceFolderName('docs', 'VERYLONGSPACEKEY123456789', allNames);
    expect(result).toBe('docs--verylong');
    expect(result.length).toBe(4 + 2 + 8); // "docs" + "--" + 8 chars
  });

  it('handles empty name gracefully', () => {
    const result = getSpaceFolderName('', 'KEY');
    expect(result).toBe('untitled');
  });

  it('handles name with only special characters', () => {
    const result = getSpaceFolderName('!!!', 'KEY');
    expect(result).toBe('untitled');
  });

  it('does not add suffix when no collision', () => {
    const allNames = ['Documentation', 'Engineering', 'Sales'];
    const result = getSpaceFolderName('Documentation', 'DOC', allNames);
    expect(result).toBe('documentation');
    expect(result).not.toContain('--');
  });

  it('is deterministic for same inputs', () => {
    const allNames = ['My Space', 'My Space'];
    const result1 = getSpaceFolderName('My Space', 'ABC', allNames);
    const result2 = getSpaceFolderName('My Space', 'ABC', allNames);
    expect(result1).toBe(result2);
  });

  it('handles unicode characters', () => {
    const result = getSpaceFolderName('Café Documentation', 'CAFE');
    // slugify strips unicode 'é' to hyphen, then collapses consecutive hyphens
    expect(result).toBe('caf-documentation');
  });
});

describe('buildSpaceFolderMap', () => {
  it('creates map for multiple spaces without collisions', () => {
    const spaces = [
      { id: '1', key: 'DOC', name: 'Documentation' },
      { id: '2', key: 'ENG', name: 'Engineering' },
      { id: '3', key: 'SALES', name: 'Sales' },
    ];

    const map = buildSpaceFolderMap(spaces);

    expect(map.size).toBe(3);
    expect(map.get('DOC')).toBe('documentation');
    expect(map.get('ENG')).toBe('engineering');
    expect(map.get('SALES')).toBe('sales');
  });

  it('handles collisions across multiple spaces', () => {
    const spaces = [
      { id: '1', key: 'ABC', name: 'My Space' },
      { id: '2', key: 'DEF', name: 'My Space' },
      { id: '3', key: 'GHI', name: 'Other Space' },
    ];

    const map = buildSpaceFolderMap(spaces);

    expect(map.size).toBe(3);
    expect(map.get('ABC')).toBe('my-space--abc');
    expect(map.get('DEF')).toBe('my-space--def');
    expect(map.get('GHI')).toBe('other-space');
  });

  it('handles personal spaces', () => {
    const spaces = [
      { id: '1', key: '~712020ace2770e28a94fecacac2555c8ec06e1', name: 'dansias' },
      { id: '2', key: '~812030bdf3881f39b05gedcbdbd3666d9fd17f2', name: 'johndoe' },
    ];

    const map = buildSpaceFolderMap(spaces);

    expect(map.size).toBe(2);
    expect(map.get('~712020ace2770e28a94fecacac2555c8ec06e1')).toBe('dansias');
    expect(map.get('~812030bdf3881f39b05gedcbdbd3666d9fd17f2')).toBe('johndoe');
  });

  it('handles mix of global and personal spaces with collisions', () => {
    const spaces = [
      { id: '1', key: 'DOC', name: 'Documentation' },
      { id: '2', key: '~user1', name: 'Documentation' }, // Collision with global
      { id: '3', key: 'ENG', name: 'Engineering' },
    ];

    const map = buildSpaceFolderMap(spaces);

    expect(map.size).toBe(3);
    expect(map.get('DOC')).toBe('documentation--doc');
    expect(map.get('~user1')).toBe('documentation--user1');
    expect(map.get('ENG')).toBe('engineering');
  });

  it('returns consistent results for same input', () => {
    const spaces = [
      { id: '1', key: 'ABC', name: 'Test' },
      { id: '2', key: 'DEF', name: 'Test' },
    ];

    const map1 = buildSpaceFolderMap(spaces);
    const map2 = buildSpaceFolderMap(spaces);

    expect(map1.get('ABC')).toBe(map2.get('ABC'));
    expect(map1.get('DEF')).toBe(map2.get('DEF'));
  });
});
