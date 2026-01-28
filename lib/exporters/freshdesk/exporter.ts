/**
 * Freshdesk Solutions exporter implementation
 */

import path from 'path';
import { ExporterProvider, ExportScope, ExportOptions } from '../types';
import { listCategories, listFolders, listArticles } from './api';
import { freshdeskFetch } from './client';
import { isPublished, isEnglish } from './filters';
import { FreshdeskArticle } from './types';
import { slugify, makeUniqueSlug } from '../utils/slugify';
import { htmlToMarkdown } from '../utils/htmlToMarkdown';
import { writeFileIdempotent } from '../utils/fileWriter';
import { splitMarkdown } from '../utils/splitMarkdown';
import {
  createReport,
  finalizeReport,
  writeReportJson,
  writeSummaryMarkdown,
  ExportReport,
  FileResult,
} from '../utils/report';

/**
 * Full article details from Freshdesk API
 */
interface FreshdeskArticleDetail extends FreshdeskArticle {
  description_text?: string;
}

export class FreshdeskExporter implements ExporterProvider {
  key = 'freshdesk';

  async preview(): Promise<import('../types').PreviewResult> {
    throw new Error('Use preview route handler instead');
  }

  /**
   * Run the export operation
   */
  async run(scope: ExportScope, options: ExportOptions): Promise<ExportReport> {
    const startTimestamp = Date.now();
    const report = createReport(options.outputDir, {
      downloadAssets: options.downloadAssets,
      maxCharsPerFile: options.maxCharsPerFile,
      languageMode: options.languageMode || 'all',
    });

    // Language filtering mode (default: 'all' since English count is often 0)
    const languageMode = options.languageMode || 'all';
    report.logs.push(`Language mode: ${languageMode}`);

    try {
      // Fetch all categories
      const allCategories = await listCategories();

      // Filter categories based on scope
      const categoriesToExport = scope.exportAll
        ? allCategories
        : allCategories.filter((c) => scope.categoryIds?.includes(c.id));

      report.logs.push(`Exporting ${categoriesToExport.length} categories`);
      report.counts.categoriesProcessed = 0;

      // Track slugs to avoid collisions
      const usedCategorySlugs = new Set<string>();
      const usedFolderSlugs = new Map<number, Set<string>>(); // categoryId -> slugs
      const usedArticleSlugs = new Map<number, Set<string>>(); // folderId -> slugs

      // Process each category
      for (const category of categoriesToExport) {
        report.logs.push(`Processing category: ${category.name} (ID: ${category.id})`);

        const categorySlug = makeUniqueSlug(
          slugify(category.name),
          usedCategorySlugs
        );
        usedCategorySlugs.add(categorySlug);

        const categoryPath = path.join(options.outputDir, 'kb', categorySlug);

        // Fetch folders in this category
        const folders = await listFolders(category.id);
        report.logs.push(`  Found ${folders.length} folders in category ${category.name}`);
        report.counts.foldersProcessed += folders.length;

        const folderSlugsForCategory = new Set<string>();
        usedFolderSlugs.set(category.id, folderSlugsForCategory);

        // Process each folder
        for (const folder of folders) {
          report.logs.push(`  Processing folder: ${folder.name} (ID: ${folder.id})`);

          const folderSlug = makeUniqueSlug(
            slugify(folder.name),
            folderSlugsForCategory
          );
          folderSlugsForCategory.add(folderSlug);

          const folderPath = path.join(categoryPath, folderSlug);

          // Fetch articles in this folder (with pagination)
          const articles = await listArticles(folder.id);
          report.logs.push(`    Fetched ${articles.length} articles from API`);

          // Log first 3 articles for debugging
          if (articles.length > 0) {
            const sampleSize = Math.min(3, articles.length);
            report.logs.push(`    Sample articles (first ${sampleSize}):`);
            for (let i = 0; i < sampleSize; i++) {
              const a = articles[i];
              report.logs.push(
                `      - ID: ${a.id}, Title: "${a.title}", Status: ${a.status}, ` +
                `Language: ${a.language || a.language_code || 'null'}, ` +
                `Updated: ${a.updated_at}`
              );
            }
          }

          // Filter for published articles
          const publishedArticles = articles.filter(isPublished);
          report.logs.push(`    After published filter: ${publishedArticles.length} articles`);

          // Apply language filter if mode is 'en'
          let articlesToExport = publishedArticles;
          if (languageMode === 'en') {
            articlesToExport = publishedArticles.filter(isEnglish);
            report.logs.push(`    After English filter: ${articlesToExport.length} articles`);
          }

          const articleSlugsForFolder = new Set<string>();
          usedArticleSlugs.set(folder.id, articleSlugsForFolder);

          // Process each article
          for (const article of articlesToExport) {
            try {
              // Fetch full article details to get HTML body
              const articleDetail = await this.fetchArticleDetail(article.id);

              const articleSlug = makeUniqueSlug(
                slugify(article.title),
                articleSlugsForFolder
              );
              articleSlugsForFolder.add(articleSlug);

              // Get article body
              const htmlBody = articleDetail.description || articleDetail.description_text || '';

              // Convert HTML to Markdown
              const markdown = htmlToMarkdown(htmlBody);

              // If body is empty, create minimal file with title
              const finalMarkdown = markdown.trim() || `# ${article.title}\n\n*Note: This article has no content.*`;

              if (!markdown.trim()) {
                report.logs.push(`    Warning: Article "${article.title}" (ID: ${article.id}) has no content`);
              }

              // Split if needed
              const baseFileName = `${articleSlug}.md`;
              const parts = splitMarkdown(
                finalMarkdown,
                baseFileName,
                options.maxCharsPerFile || 0
              );

              // Write each part
              for (const part of parts) {
                const filePath = path.join(folderPath, part.fileName);

                try {
                  const result = await writeFileIdempotent(filePath, part.content);

                  const fileResult: FileResult = {
                    path: filePath,
                    status: result.status,
                    articleId: article.id,
                    articleTitle: article.title,
                  };

                  report.files.push(fileResult);

                  if (result.status === 'created') {
                    report.counts.filesCreated++;
                  } else if (result.status === 'updated') {
                    report.counts.filesUpdated++;
                  } else if (result.status === 'skipped') {
                    report.counts.filesSkipped++;
                  }
                } catch (error) {
                  const fileResult: FileResult = {
                    path: filePath,
                    status: 'failed',
                    error: error instanceof Error ? error.message : 'Unknown error',
                    articleId: article.id,
                    articleTitle: article.title,
                  };

                  report.files.push(fileResult);
                  report.counts.filesFailed++;
                  report.logs.push(`    Error writing file: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
              }

              report.counts.articlesProcessed++;
            } catch (error) {
              // Article processing failed
              const fileResult: FileResult = {
                path: path.join(folderPath, `${slugify(article.title)}.md`),
                status: 'failed',
                error: error instanceof Error ? error.message : 'Unknown error',
                articleId: article.id,
                articleTitle: article.title,
              };

              report.files.push(fileResult);
              report.counts.filesFailed++;
              report.logs.push(`    Error processing article "${article.title}": ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          }

          if (articlesToExport.length === 0) {
            report.logs.push(`    No articles to export in folder ${folder.name}`);
          }
        }

        report.counts.categoriesProcessed++;
      }

      report.logs.push(`Export complete: ${report.counts.articlesProcessed} articles processed`);

      // Finalize report
      const finalReport = finalizeReport(report, startTimestamp);

      // Write report files
      await writeReportJson(options.outputDir, finalReport);
      await writeSummaryMarkdown(options.outputDir, finalReport);

      return finalReport;
    } catch (error) {
      // Export failed
      report.logs.push(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      const finalReport = finalizeReport(report, startTimestamp);

      // Still write reports even on failure
      try {
        await writeReportJson(options.outputDir, finalReport);
        await writeSummaryMarkdown(options.outputDir, finalReport);
      } catch (reportError) {
        // Ignore report writing errors
      }

      throw error;
    }
  }

  /**
   * Fetch full article details including HTML body
   */
  private async fetchArticleDetail(articleId: number): Promise<FreshdeskArticleDetail> {
    return freshdeskFetch<FreshdeskArticleDetail>(`/api/v2/solutions/articles/${articleId}`);
  }
}
