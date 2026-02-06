import { describe, it, expect } from 'vitest';
import { validatePathWithinBase, validateRootName } from '../path-validation';
import { join } from 'path';

describe('validatePathWithinBase', () => {
  const basePath = '/exports';

  it('should accept valid paths within base', () => {
    expect(validatePathWithinBase(basePath, 'freshdesk-kb')).toBe(
      join(basePath, 'freshdesk-kb')
    );
    expect(validatePathWithinBase(basePath, 'freshdesk-kb/kb/folder')).toBe(
      join(basePath, 'freshdesk-kb/kb/folder')
    );
  });

  it('should reject path traversal attempts with ..', () => {
    expect(() => validatePathWithinBase(basePath, '../package.json')).toThrow(
      'Invalid path: attempted path traversal'
    );
    expect(() => validatePathWithinBase(basePath, 'kb/../../package.json')).toThrow(
      'Invalid path: attempted path traversal'
    );
  });

  it('should reject absolute paths', () => {
    expect(() => validatePathWithinBase(basePath, '/etc/passwd')).toThrow(
      'Invalid path: attempted path traversal'
    );
  });
});

describe('validateRootName', () => {
  it('should accept valid root names', () => {
    expect(() => validateRootName('freshdesk-kb')).not.toThrow();
    expect(() => validateRootName('confluence-kb')).not.toThrow();
    expect(() => validateRootName('test123')).not.toThrow();
  });

  it('should reject empty or invalid root names', () => {
    expect(() => validateRootName('')).toThrow('Root name is required');
    // @ts-expect-error Testing invalid input
    expect(() => validateRootName(null)).toThrow('Root name is required');
  });

  it('should reject root names with path separators', () => {
    expect(() => validateRootName('kb/folder')).toThrow(
      'Invalid root name: contains invalid characters'
    );
    expect(() => validateRootName('kb\\folder')).toThrow(
      'Invalid root name: contains invalid characters'
    );
  });

  it('should reject root names with path traversal attempts', () => {
    expect(() => validateRootName('..')).toThrow(
      'Invalid root name: contains invalid characters'
    );
    expect(() => validateRootName('../kb')).toThrow(
      'Invalid root name: contains invalid characters'
    );
    expect(() => validateRootName('.hidden')).toThrow(
      'Invalid root name: contains invalid characters'
    );
  });

  it('should reject root names with suspicious characters', () => {
    expect(() => validateRootName('kb<script>')).toThrow(
      'Invalid root name: contains invalid characters'
    );
    expect(() => validateRootName('kb|rm')).toThrow(
      'Invalid root name: contains invalid characters'
    );
  });
});
