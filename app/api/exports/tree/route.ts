import { NextResponse } from 'next/server';
import { readdir, stat } from 'fs/promises';
import { join } from 'path';
import { validateRootName, validatePathWithinBase } from '@/lib/utils/path-validation';

const EXPORTS_DIR = join(process.cwd(), 'exports');

interface FileNode {
  name: string;
  type: 'file' | 'directory';
  path: string; // relative to root
  size?: number;
  modified?: string;
  children?: FileNode[];
}

interface TreeStats {
  totalFolders: number;
  totalFiles: number;
  totalMarkdownFiles: number;
  totalSize: number;
  largestFiles: Array<{ path: string; size: number }>;
  recentFiles: Array<{ path: string; modified: string }>;
  hasReport: boolean;
  hasSummary: boolean;
}

/**
 * Recursively build file tree
 */
async function buildFileTree(dirPath: string, relativePath: string = ''): Promise<FileNode[]> {
  const entries = await readdir(dirPath, { withFileTypes: true });

  const nodes = await Promise.all(
    entries.map(async (entry): Promise<FileNode> => {
      const fullPath = join(dirPath, entry.name);
      const entryRelativePath = relativePath ? `${relativePath}/${entry.name}` : entry.name;
      const stats = await stat(fullPath);

      if (entry.isDirectory()) {
        const children = await buildFileTree(fullPath, entryRelativePath);
        return {
          name: entry.name,
          type: 'directory',
          path: entryRelativePath,
          children,
        };
      } else {
        return {
          name: entry.name,
          type: 'file',
          path: entryRelativePath,
          size: stats.size,
          modified: stats.mtime.toISOString(),
        };
      }
    })
  );

  // Sort: directories first, then files, both alphabetically
  return nodes.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === 'directory' ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });
}

/**
 * Calculate stats from file tree
 */
function calculateStats(tree: FileNode[], rootPath: string): TreeStats {
  const stats: TreeStats = {
    totalFolders: 0,
    totalFiles: 0,
    totalMarkdownFiles: 0,
    totalSize: 0,
    largestFiles: [],
    recentFiles: [],
    hasReport: false,
    hasSummary: false,
  };

  const allFiles: Array<{ path: string; size: number; modified: string }> = [];

  function traverse(nodes: FileNode[]) {
    for (const node of nodes) {
      if (node.type === 'directory') {
        stats.totalFolders++;
        if (node.children) {
          traverse(node.children);
        }
      } else {
        stats.totalFiles++;
        stats.totalSize += node.size || 0;

        if (node.name.endsWith('.md')) {
          stats.totalMarkdownFiles++;
        }

        // Check for special files
        if (node.path === 'report.json') {
          stats.hasReport = true;
        }
        if (node.path === 'SUMMARY.md') {
          stats.hasSummary = true;
        }

        allFiles.push({
          path: node.path,
          size: node.size || 0,
          modified: node.modified || '',
        });
      }
    }
  }

  traverse(tree);

  // Top 5 largest files
  stats.largestFiles = allFiles
    .sort((a, b) => b.size - a.size)
    .slice(0, 5)
    .map(({ path, size }) => ({ path, size }));

  // Top 5 most recent files
  stats.recentFiles = allFiles
    .sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime())
    .slice(0, 5)
    .map(({ path, modified }) => ({ path, modified }));

  return stats;
}

/**
 * GET /api/exports/tree?root=<rootName>
 * Get file tree for an export root
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rootName = searchParams.get('root');

    if (!rootName) {
      return NextResponse.json(
        { error: 'Missing required parameter: root' },
        { status: 400 }
      );
    }

    // Validate root name (prevent path traversal)
    validateRootName(rootName);

    // Construct and validate root path
    const rootPath = validatePathWithinBase(EXPORTS_DIR, rootName);

    // Verify root exists and is a directory
    const rootStats = await stat(rootPath);
    if (!rootStats.isDirectory()) {
      return NextResponse.json(
        { error: 'Root is not a directory' },
        { status: 400 }
      );
    }

    // Build file tree
    const tree = await buildFileTree(rootPath);

    // Calculate stats
    const stats = calculateStats(tree, rootPath);

    return NextResponse.json(
      { tree, stats },
      {
        headers: { 'Cache-Control': 'no-store' },
      }
    );
  } catch (error) {
    console.error('Failed to build file tree:', error);

    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return NextResponse.json(
        { error: 'Export root not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to build file tree', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
