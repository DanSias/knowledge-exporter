import { NextResponse } from 'next/server';
import { readdir, stat } from 'fs/promises';
import { join } from 'path';

const EXPORTS_DIR = join(process.cwd(), 'exports');

/**
 * GET /api/exports/roots
 * List all export root directories
 */
export async function GET() {
  try {
    // Read exports directory
    const entries = await readdir(EXPORTS_DIR, { withFileTypes: true });

    // Filter to directories only and gather basic stats
    const roots = await Promise.all(
      entries
        .filter((entry) => entry.isDirectory())
        .map(async (entry) => {
          const rootPath = join(EXPORTS_DIR, entry.name);
          const stats = await stat(rootPath);

          // Check for special files
          let hasReport = false;
          let hasSummary = false;
          try {
            await stat(join(rootPath, 'report.json'));
            hasReport = true;
          } catch {
            // File doesn't exist
          }
          try {
            await stat(join(rootPath, 'SUMMARY.md'));
            hasSummary = true;
          } catch {
            // File doesn't exist
          }

          return {
            name: entry.name,
            modified: stats.mtime.toISOString(),
            hasReport,
            hasSummary,
          };
        })
    );

    // Sort by most recently modified
    roots.sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime());

    return NextResponse.json(roots, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('Failed to list export roots:', error);

    // If exports directory doesn't exist, return empty array
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return NextResponse.json([], {
        headers: { 'Cache-Control': 'no-store' },
      });
    }

    return NextResponse.json(
      { error: 'Failed to list export roots', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
