/**
 * Unit tests for writeFileIdempotent
 * Verifies that the status returned (created/updated/skipped) is accurate
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { writeFileIdempotent } from './fileWriter';

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'filewriter-test-'));
});

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe('writeFileIdempotent', () => {
  it('returns status=created when file does not exist', async () => {
    const filePath = path.join(tmpDir, 'new-file.md');
    const result = await writeFileIdempotent(filePath, '# Hello');

    expect(result.status).toBe('created');
    expect(result.bytes).toBeGreaterThan(0);
    expect(result.hash).toBeTruthy();

    // File must exist on disk
    const content = await fs.readFile(filePath, 'utf8');
    expect(content).toBe('# Hello');
  });

  it('returns status=skipped when file exists with identical content', async () => {
    const filePath = path.join(tmpDir, 'existing.md');
    const content = '# Same content\n\nNo changes here.';

    // Write once
    await writeFileIdempotent(filePath, content);

    // Write again with same content
    const result = await writeFileIdempotent(filePath, content);

    expect(result.status).toBe('skipped');
    expect(result.hash).toBeTruthy();

    // File still on disk unchanged
    const diskContent = await fs.readFile(filePath, 'utf8');
    expect(diskContent).toBe(content);
  });

  it('returns status=updated when file exists with different content', async () => {
    const filePath = path.join(tmpDir, 'changing.md');

    // Write original
    await writeFileIdempotent(filePath, '# Original');

    // Write updated content
    const result = await writeFileIdempotent(filePath, '# Updated');

    expect(result.status).toBe('updated');

    // Disk must have new content
    const diskContent = await fs.readFile(filePath, 'utf8');
    expect(diskContent).toBe('# Updated');
  });

  it('creates parent directories automatically', async () => {
    const filePath = path.join(tmpDir, 'deep', 'nested', 'dir', 'file.md');
    const result = await writeFileIdempotent(filePath, 'content');

    expect(result.status).toBe('created');
    const diskContent = await fs.readFile(filePath, 'utf8');
    expect(diskContent).toBe('content');
  });

  it('returns correct byte count', async () => {
    const filePath = path.join(tmpDir, 'bytes.md');
    const content = 'Hello'; // 5 bytes in UTF-8
    const result = await writeFileIdempotent(filePath, content);

    expect(result.bytes).toBe(5);
    expect(result.status).toBe('created');
  });

  it('hash is stable across calls for same content', async () => {
    const filePath1 = path.join(tmpDir, 'a.md');
    const filePath2 = path.join(tmpDir, 'b.md');
    const content = '# Same content for hash check';

    const result1 = await writeFileIdempotent(filePath1, content);
    const result2 = await writeFileIdempotent(filePath2, content);

    expect(result1.hash).toBe(result2.hash);
  });

  it('does not overwrite file data when returning skipped', async () => {
    const filePath = path.join(tmpDir, 'nowrite.md');
    const content = '# Original content';

    await writeFileIdempotent(filePath, content);

    // Record mtime before second call
    const statBefore = await fs.stat(filePath);

    // Small delay to ensure mtime would differ if written
    await new Promise((r) => setTimeout(r, 10));

    await writeFileIdempotent(filePath, content);

    const statAfter = await fs.stat(filePath);

    // mtime should be unchanged (file not rewritten)
    expect(statAfter.mtimeMs).toBe(statBefore.mtimeMs);
  });

  it('handles empty string content', async () => {
    const filePath = path.join(tmpDir, 'empty.md');
    const result = await writeFileIdempotent(filePath, '');

    expect(result.status).toBe('created');
    expect(result.bytes).toBe(0);
  });

  it('correctly detects update after content changes from empty', async () => {
    const filePath = path.join(tmpDir, 'fromempty.md');

    await writeFileIdempotent(filePath, '');
    const result = await writeFileIdempotent(filePath, '# Now has content');

    expect(result.status).toBe('updated');
  });
});
