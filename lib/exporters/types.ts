/**
 * Core types for knowledge base exporters
 */

export interface FolderPreview {
  id: number;
  name: string;
  articleCount: number;
  publishedArticleCount: number;
  englishPublishedArticleCount: number;
}

export interface CategoryPreview {
  id: number;
  name: string;
  folderCount: number;
  articleCount: number;
  publishedArticleCount: number;
  englishPublishedArticleCount: number;
  folders: FolderPreview[];
}

export interface PreviewTotals {
  categoryCount: number;
  folderCount: number;
  articleCount: number;
  publishedArticleCount: number;
  englishPublishedArticleCount: number;
}

export interface PreviewResult {
  baseUrl: string;
  categories: CategoryPreview[];
  totals: PreviewTotals;
}

export interface ExportScope {
  exportAll: boolean;
  categoryIds?: number[]; // For Freshdesk
  spaceIds?: string[]; // For Confluence
}

export interface ExportOptions {
  outputDir: string;
  runName?: string; // Optional run name (auto-generated if not provided)
  downloadAssets: boolean;
  maxCharsPerFile?: number;
  languageMode?: 'all' | 'en'; // 'all' = all languages, 'en' = English only
}

/**
 * Provider interface for knowledge base exporters
 * Allows for multiple providers (Freshdesk, Zendesk, etc.)
 */
export interface ExporterProvider {
  /**
   * Unique identifier for this provider
   */
  key: string;

  /**
   * Preview available content without exporting
   * Returns categories with article counts
   */
  preview(scope?: ExportScope): Promise<PreviewResult>;

  /**
   * Run export with given scope and options
   * Returns export report
   */
  run(scope: ExportScope, options: ExportOptions): Promise<import('./utils/report').ExportReport>;
}
