/**
 * Confluence export estimate logic
 * Fetches page counts for selected spaces to provide accurate estimates
 */

import { listSpaces, listPagesInSpace } from './api';
import { ExportScope, ExportOptions } from '../types';

export interface ExportEstimate {
  provider: 'freshdesk' | 'confluence';
  scopeSummary: string;
  estimatedFiles: number | null;
  estimatedSizeBytes: number | null;
  warnings: string[];
  notes: string[];
}

/**
 * Estimate Confluence export without fetching page bodies
 */
export async function estimateConfluenceExport(
  scope: ExportScope,
  options: ExportOptions
): Promise<ExportEstimate> {
  const warnings: string[] = [];
  const notes: string[] = [];

  try {
    // Fetch all spaces
    const allSpaces = await listSpaces();

    // DEBUG LOGGING (dev-only)
    if (process.env.NODE_ENV !== 'production') {
      console.log('[estimateConfluenceExport] Debug - All spaces:', allSpaces.map(s => ({ id: s.id, idType: typeof s.id, key: s.key })));
      console.log('[estimateConfluenceExport] Debug - Scope:', scope);
      console.log('[estimateConfluenceExport] Debug - Scope.spaceKeys:', scope.spaceKeys);
    }

    // Filter spaces based on scope
    const spacesToExport = scope.exportAll
      ? allSpaces
      : allSpaces.filter((s) => scope.spaceKeys?.includes(s.key));

    // DEBUG LOGGING (dev-only)
    if (process.env.NODE_ENV !== 'production') {
      console.log('[estimateConfluenceExport] Debug - Filtered spaces:', spacesToExport.map(s => ({ id: s.id, key: s.key, name: s.name })));
    }

    if (spacesToExport.length === 0) {
      return {
        provider: 'confluence',
        scopeSummary: 'No spaces selected',
        estimatedFiles: null,
        estimatedSizeBytes: null,
        warnings: ['No spaces selected for export'],
        notes: [],
      };
    }

    // Generate scope summary
    const scopeSummary = `${spacesToExport.length} ${
      spacesToExport.length === 1 ? 'space' : 'spaces'
    }`;

    // Count personal spaces
    const personalSpaceCount = spacesToExport.filter((s) => s.type === 'personal').length;

    // Estimated files and warnings
    let estimatedFiles: number | null = null;
    let anyTruncated = false;

    if (scope.exportAll) {
      // Export all: Cannot reliably estimate without fetching all pages
      estimatedFiles = null;
      notes.push('Exact file count will be determined during export');
      warnings.push('Some spaces may be truncated at 500 pages per space');
    } else if (spacesToExport.length <= 10) {
      // Small selection: Fetch actual page counts
      try {
        let totalPages = 0;
        const MAX_PAGES_PER_SPACE = 500;

        for (const space of spacesToExport) {
          const pages = await listPagesInSpace(space.key);
          totalPages += pages.length;

          // Check if this space was truncated
          if (pages.length >= MAX_PAGES_PER_SPACE) {
            anyTruncated = true;
          }
        }

        estimatedFiles = totalPages;

        // Only warn about truncation if a space actually hit the limit
        if (anyTruncated) {
          warnings.push('One or more spaces truncated at 500 pages per space');
        }
      } catch (error) {
        // If fetching fails, fall back to null
        estimatedFiles = null;
        notes.push('Could not fetch page counts; count will be determined during export');
      }
    } else {
      // Large selection: Too many spaces to fetch counts efficiently
      estimatedFiles = null;
      notes.push('File count will be determined during export (too many spaces to estimate)');
      warnings.push('Some spaces may be truncated at 500 pages per space');
    }

    if (personalSpaceCount > 0) {
      notes.push(
        `${personalSpaceCount} personal ${personalSpaceCount === 1 ? 'space' : 'spaces'} included`
      );
    }

    if (options.maxCharsPerFile && options.maxCharsPerFile > 0) {
      notes.push(
        `Large pages will be split into multiple files (max ${options.maxCharsPerFile} chars per file)`
      );
    }

    if (!options.downloadAssets) {
      notes.push('Attachments will remain as remote links (download assets disabled)');
    }

    return {
      provider: 'confluence',
      scopeSummary,
      estimatedFiles,
      estimatedSizeBytes: null, // Can't estimate without fetching page bodies
      warnings,
      notes,
    };
  } catch (error) {
    return {
      provider: 'confluence',
      scopeSummary: 'Error estimating export',
      estimatedFiles: null,
      estimatedSizeBytes: null,
      warnings: [
        `Failed to estimate export: ${error instanceof Error ? error.message : 'Unknown error'}`,
      ],
      notes: [],
    };
  }
}
