import { NextResponse } from 'next/server';
import { readFile, stat } from 'fs/promises';
import { join } from 'path';
import { validatePathWithinBase } from '@/lib/utils/path-validation';

const EXPORTS_DIR = join(process.cwd(), 'exports');

/**
 * GET /api/exports/file?path=<relativePath>
 * Read a file from exports directory
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const relativePath = searchParams.get('path');

    if (!relativePath) {
      return NextResponse.json(
        { error: 'Missing required parameter: path' },
        { status: 400 }
      );
    }

    // Validate path is within exports directory (prevent path traversal)
    const filePath = validatePathWithinBase(EXPORTS_DIR, relativePath);

    // Verify file exists and is not a directory
    const fileStats = await stat(filePath);
    if (fileStats.isDirectory()) {
      return NextResponse.json(
        { error: 'Path is a directory, not a file' },
        { status: 400 }
      );
    }

    // Read file content
    const content = await readFile(filePath, 'utf-8');

    return NextResponse.json(
      {
        content,
        size: fileStats.size,
        modified: fileStats.mtime.toISOString(),
      },
      {
        headers: { 'Cache-Control': 'no-store' },
      }
    );
  } catch (error) {
    console.error('Failed to read file:', error);

    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to read file', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
