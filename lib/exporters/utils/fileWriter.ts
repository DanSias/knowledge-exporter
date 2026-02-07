/**
 * Atomic file writing utilities
 */

import fs from 'fs/promises';
import path from 'path';
import { hashContent } from './hashing';

export interface WriteResult {
  status: 'created' | 'updated' | 'skipped';
  path: string;
  bytes: number;  // File size in bytes
  hash: string;   // Content hash
}

/**
 * Ensure directory exists, create if missing
 */
export async function ensureDir(dirPath: string): Promise<void> {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    // Ignore if directory already exists
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
      throw error;
    }
  }
}

/**
 * Write file atomically with idempotency check
 * - If file exists and content unchanged: skip
 * - If file exists and content changed: update
 * - If file doesn't exist: create
 */
export async function writeFileIdempotent(
  filePath: string,
  content: string
): Promise<WriteResult> {
  // Ensure parent directory exists
  const dir = path.dirname(filePath);
  await ensureDir(dir);

  // Check if file exists
  let existingContent: string | null = null;
  try {
    existingContent = await fs.readFile(filePath, 'utf8');
  } catch (error) {
    // File doesn't exist, will create
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
  }

  // Compute hash of new content
  const newHash = hashContent(content);
  const bytes = Buffer.byteLength(content, 'utf8');

  // If file exists, check if content changed
  if (existingContent !== null) {
    const existingHash = hashContent(existingContent);

    if (existingHash === newHash) {
      return {
        status: 'skipped',
        path: filePath,
        bytes,
        hash: newHash,
      };
    }
  }

  // Write file (create or update)
  await fs.writeFile(filePath, content, 'utf8');

  return {
    status: existingContent === null ? 'created' : 'updated',
    path: filePath,
    bytes,
    hash: newHash,
  };
}

/**
 * Read file safely, return null if not exists
 */
export async function readFileSafe(filePath: string): Promise<string | null> {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

/**
 * Check if file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
