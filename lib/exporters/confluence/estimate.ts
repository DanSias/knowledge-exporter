/**
 * Confluence export estimate logic
 * Lightweight estimate without fetching full page bodies
 */

import { listSpaces } from './api';
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

    // Filter spaces based on scope
    const spacesToExport = scope.exportAll
      ? allSpaces
      : allSpaces.filter((s) => scope.spaceIds?.includes(s.id.toString()));

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

    // Estimated files
    let estimatedFiles: number | null = null;

    if (scope.exportAll) {
      // Export all: Cannot reliably estimate
      estimatedFiles = null;
      notes.push('Exact file count will be determined during export');
    } else if (spacesToExport.length <= 5) {
      // Small selection: Can provide rough estimate
      // Note: We avoid fetching pages to keep this lightweight
      // Instead, provide a conservative estimate
      estimatedFiles = null; // Still avoid false precision
      notes.push(
        'Estimated files will depend on page count per space (fetched during export)'
      );
    } else {
      // Large selection: Cannot reliably estimate
      estimatedFiles = null;
      notes.push('File count will be determined during export');
    }

    // Warnings
    warnings.push('Some spaces may be truncated at 500 pages per space');

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
