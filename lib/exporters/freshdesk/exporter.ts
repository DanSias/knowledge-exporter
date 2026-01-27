/**
 * Freshdesk Solutions exporter implementation
 */

import path from 'path';
import { ExporterProvider, ExportScope, ExportOptions } from '../types';
import { listCategories, listFolders, listArticles } from './api';
import { freshdeskFetch } from './client';
import { isPublishedEnglish } from './filters';
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
    });

    try {
      // Fetch all categories
      const allCategories = await listCategories();

      // Filter categories based on scope
      const categoriesToExport = scope.exportAll
        ? allCategories
        : allCategories.filter((c) => scope.categoryIds?.includes(c.id));

      report.counts.categoriesProcessed = 0;

      // Track slugs to avoid collisions
      const usedCategorySlugs = new Set<string>();
      const usedFolderSlugs = new Map<number, Set<string>>(); // categoryId -> slugs
      const usedArticleSlugs = new Map<number, Set<string>>(); // folderId -> slugs

      // Process each category
      for (const category of categoriesToExport) {
        const categorySlug = makeUniqueSlug(
          slugify(category.name),
          usedCategorySlugs
        );
        usedCategorySlugs.add(categorySlug);

        const categoryPath = path.join(options.outputDir, 'kb', categorySlug);

        // Fetch folders in this category
        const folders = await listFolders(category.id);
        report.counts.foldersProcessed += folders.length;

        const folderSlugsForCategory = new Set<string>();
        usedFolderSlugs.set(category.id, folderSlugsForCategory);

        // Process each folder
        for (const folder of folders) {
          const folderSlug = makeUniqueSlug(
            slugify(folder.name),
            folderSlugsForCategory
          );
          folderSlugsForCategory.add(folderSlug);

          const folderPath = path.join(categoryPath, folderSlug);

          // Fetch articles in this folder
          const articles = await listArticles(folder.id);

          // Filter for published English articles
          const publishedEnglishArticles = articles.filter(isPublishedEnglish);

          const articleSlugsForFolder = new Set<string>();
          usedArticleSlugs.set(folder.id, articleSlugsForFolder);

          // Process each article
          for (const article of publishedEnglishArticles) {
            try {
              // Fetch full article details to get HTML body
              const articleDetail = await this.fetchArticleDetail(article.id);

              const articleSlug = makeUniqueSlug(
                slugify(article.title),
                articleSlugsForFolder
              );
              articleSlugsForFolder.add(articleSlug);

              // Convert HTML to Markdown
              const markdown = htmlToMarkdown(
                articleDetail.description || articleDetail.description_text || ''
              );

              // Split if needed
              const baseFileName = `${articleSlug}.md`;
              const parts = splitMarkdown(
                markdown,
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
            }
          }
        }

        report.counts.categoriesProcessed++;
      }

      // Finalize report
      const finalReport = finalizeReport(report, startTimestamp);

      // Write report files
      await writeReportJson(options.outputDir, finalReport);
      await writeSummaryMarkdown(options.outputDir, finalReport);

      return finalReport;
    } catch (error) {
      // Export failed
      const finalReport = finalizeReport(report, startTimestamp);
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
