import { join, normalize, relative } from 'path';

/**
 * Validates that a given path is safely within a base directory
 * Prevents path traversal attacks (../, ../../, etc.)
 */
export function validatePathWithinBase(basePath: string, userPath: string): string {
  // Reject absolute paths upfront
  if (userPath.startsWith('/') || /^[A-Z]:/i.test(userPath)) {
    throw new Error('Invalid path: attempted path traversal');
  }

  // Normalize and resolve the paths
  const normalizedBase = normalize(basePath);
  const resolvedPath = normalize(join(normalizedBase, userPath));

  // Calculate relative path from base to resolved
  const relativePath = relative(normalizedBase, resolvedPath);

  // If relative path starts with '..' or is absolute, it's outside base
  if (relativePath.startsWith('..') || relativePath.startsWith('/') || /^[A-Z]:/i.test(relativePath)) {
    throw new Error('Invalid path: attempted path traversal');
  }

  return resolvedPath;
}

/**
 * Validates that a root name is a direct child of exports directory
 * (no slashes, no dots, no special characters)
 */
export function validateRootName(rootName: string): void {
  if (!rootName || typeof rootName !== 'string') {
    throw new Error('Root name is required');
  }

  // Check for path traversal attempts
  if (rootName.includes('/') || rootName.includes('\\') || rootName.includes('..') || rootName.startsWith('.')) {
    throw new Error('Invalid root name: contains invalid characters');
  }

  // Check for other suspicious patterns
  if (/[<>:"|?*\x00-\x1f]/g.test(rootName)) {
    throw new Error('Invalid root name: contains invalid characters');
  }
}
