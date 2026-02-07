/**
 * Freshdesk export estimate logic
 * Lightweight estimate without file writes or hashing
 */

import { listCategories, listFolders, listArticles } from './api';
import { isPublished, isEnglish } from './filters';
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
 * Estimate Freshdesk export without writing files
 */
export async function estimateFreshdeskExport(
  scope: ExportScope,
  options: ExportOptions
): Promise<ExportEstimate> {
  const warnings: string[] = [];
  const notes: string[] = [];

  try {
    // Fetch categories
    const allCategories = await listCategories();

    // Filter categories based on scope
    const categoriesToExport = scope.exportAll
      ? allCategories
      : allCategories.filter((c) => scope.categoryIds?.includes(c.id));

    if (categoriesToExport.length === 0) {
      return {
        provider: 'freshdesk',
        scopeSummary: 'No categories selected',
        estimatedFiles: 0,
        estimatedSizeBytes: null,
        warnings: ['No categories selected for export'],
        notes: [],
      };
    }

    // Count folders and articles
    let totalFolders = 0;
    let totalArticles = 0;
    let emptyBodyCount = 0;
    const languageMode = options.languageMode || 'all';

    for (const category of categoriesToExport) {
      const folders = await listFolders(category.id);
      totalFolders += folders.length;

      for (const folder of folders) {
        const articles = await listArticles(folder.id);

        // Apply filters
        const publishedArticles = articles.filter(isPublished);
        let articlesToCount = publishedArticles;

        if (languageMode === 'en') {
          articlesToCount = publishedArticles.filter(isEnglish);
        }

        totalArticles += articlesToCount.length;

        // Check for empty bodies (without fetching full details)
        // We can't know for sure without fetching, so estimate conservatively
      }
    }

    // Generate scope summary
    const scopeSummary = `${categoriesToExport.length} ${
      categoriesToExport.length === 1 ? 'category' : 'categories'
    }, ${totalFolders} ${totalFolders === 1 ? 'folder' : 'folders'}`;

    // Add warnings
    if (!options.downloadAssets) {
      warnings.push('Attachments will remain as remote links (download assets disabled)');
    }

    if (languageMode === 'en') {
      notes.push('Only English articles will be exported (language filter active)');
    }

    if (options.maxCharsPerFile && options.maxCharsPerFile > 0) {
      notes.push(
        `Large articles will be split into multiple files (max ${options.maxCharsPerFile} chars per file)`
      );
    }

    // Estimated files = articles (some may split if maxCharsPerFile is set, but we don't know without fetching bodies)
    const estimatedFiles = totalArticles;

    // Add note about potential splitting
    if (options.maxCharsPerFile && options.maxCharsPerFile > 0 && totalArticles > 0) {
      notes.push('Actual file count may be higher if articles are split');
    }

    return {
      provider: 'freshdesk',
      scopeSummary,
      estimatedFiles,
      estimatedSizeBytes: null, // Can't estimate without fetching full article bodies
      warnings,
      notes,
    };
  } catch (error) {
    return {
      provider: 'freshdesk',
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
