import { NextResponse } from 'next/server';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { validatePathWithinBase } from '@/lib/utils/path-validation';

const EXPORTS_DIR = join(process.cwd(), 'exports');

/**
 * POST /api/exports/delete
 * Delete a file from exports directory
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { path: relativePath } = body;

    if (!relativePath) {
      return NextResponse.json(
        { error: 'Missing required parameter: path' },
        { status: 400 }
      );
    }

    // Validate path is within exports directory (prevent path traversal)
    const filePath = validatePathWithinBase(EXPORTS_DIR, relativePath);

    // Delete the file
    await unlink(filePath);

    return NextResponse.json(
      { success: true, message: 'File deleted successfully' },
      {
        headers: { 'Cache-Control': 'no-store' },
      }
    );
  } catch (error) {
    console.error('Failed to delete file:', error);

    // Handle specific error cases
    if (error instanceof Error) {
      if (error.message.includes('path traversal')) {
        return NextResponse.json(
          { error: 'Invalid path', details: error.message },
          { status: 403 }
        );
      }

      if ('code' in error && error.code === 'ENOENT') {
        return NextResponse.json(
          { error: 'File not found' },
          { status: 404 }
        );
      }

      if ('code' in error && error.code === 'EISDIR') {
        return NextResponse.json(
          { error: 'Cannot delete directories', details: 'Only files can be deleted' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to delete file', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
