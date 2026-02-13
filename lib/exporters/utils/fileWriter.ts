/**
 * Atomic file writing utilities
 */

import fs from 'fs/promises';
import path from 'path';
import { hashContent } from './hashing';

// Dev-only: log first N file decisions per export run
let _debugFileCount = 0;
const DEBUG_SAMPLE_LIMIT = 5;

/** Call at the start of each export run to reset debug sampling */
export function resetDebugFileCounter(): void {
  _debugFileCount = 0;
}

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
  let status: 'created' | 'updated' | 'skipped';
  if (existingContent !== null) {
    const existingHash = hashContent(existingContent);
    if (existingHash === newHash) {
      status = 'skipped';
    } else {
      status = 'updated';
    }
  } else {
    status = 'created';
  }

  // DEBUG LOGGING (dev-only): first 5 files per run
  if (process.env.NODE_ENV !== 'production' && _debugFileCount < DEBUG_SAMPLE_LIMIT) {
    _debugFileCount++;
    const existingHash = existingContent !== null ? hashContent(existingContent) : null;
    console.log(`[fileWriter] #${_debugFileCount} ${path.basename(filePath)}`);
    console.log(`  path: ${filePath}`);
    console.log(`  exists: ${existingContent !== null}`);
    console.log(`  prevHash: ${existingHash ?? 'n/a'}`);
    console.log(`  newHash:  ${newHash}`);
    console.log(`  status:   ${status}`);
  }

  if (status === 'skipped') {
    return { status, path: filePath, bytes, hash: newHash };
  }

  // Write file (create or update)
  await fs.writeFile(filePath, content, 'utf8');

  return {
    status,
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
