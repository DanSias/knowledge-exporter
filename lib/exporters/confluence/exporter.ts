/**
 * Confluence Cloud exporter implementation
 */

import path from 'path';
import { ExporterProvider, ExportScope, ExportOptions } from '../types';
import { listSpaces, listPagesInSpace, getPage } from './api';
import { ConfluenceSpace, ConfluencePage, ConfluencePageWithBody } from './types';
import { slugify, makeUniqueSlug } from '../utils/slugify';
import { htmlToMarkdown } from '../utils/htmlToMarkdown';
import { ensureTitleHeading } from '../utils/ensureTitleHeading';
import { writeFileIdempotent } from '../utils/fileWriter';
import { splitMarkdown } from '../utils/splitMarkdown';
import { buildOutputPath } from '../utils/runName';
import {
  createReport,
  finalizeReport,
  writeReportJson,
  writeSummaryMarkdown,
  ExportReport,
  FileResult,
} from '../utils/report';

export interface ProgressCallback {
  (phase: string, progress: {
    pagesProcessed: number;
    pagesFailed: number;
    filesCreated: number;
    filesUpdated: number;
    filesSkipped: number;
  }): void;
}

export class ConfluenceExporter implements ExporterProvider {
  key = 'confluence';
  private progressCallback?: ProgressCallback;

  async preview(): Promise<import('../types').PreviewResult> {
    throw new Error('Use preview route handler instead');
  }

  /**
   * Set progress callback for live updates
   */
  setProgressCallback(callback: ProgressCallback): void {
    this.progressCallback = callback;
  }

  /**
   * Report progress to callback if set
   */
  private reportProgress(phase: string, report: ExportReport): void {
    if (this.progressCallback) {
      this.progressCallback(phase, {
        pagesProcessed: report.counts.pagesProcessed || 0,
        pagesFailed: report.counts.pagesFailed || 0,
        filesCreated: report.counts.filesCreated,
        filesUpdated: report.counts.filesUpdated,
        filesSkipped: report.counts.filesSkipped,
      });
    }
  }

  /**
   * Run the export operation
   */
  async run(scope: ExportScope, options: ExportOptions): Promise<ExportReport> {
    const startTimestamp = Date.now();

    // Build the full output path with run name
    const outputDir = buildOutputPath('./exports', 'confluence', options.runName);

    const report = createReport(outputDir, 'confluence', options.runName || null, {
      downloadAssets: options.downloadAssets,
      maxCharsPerFile: options.maxCharsPerFile,
    });

    try {
      // Fetch all spaces
      this.reportProgress('Fetching spaces from Confluence...', report);
      const allSpaces = await listSpaces();
      report.logs.push(`Fetched ${allSpaces.length} total spaces from Confluence`);

      // Filter spaces based on scope
      const spacesToExport = scope.exportAll
        ? allSpaces
        : allSpaces.filter((s) => scope.spaceIds?.includes(s.id.toString()));

      report.logs.push(`Exporting ${spacesToExport.length} spaces`);
      this.reportProgress(`Exporting ${spacesToExport.length} spaces...`, report);

      // Track slugs to avoid collisions within each space
      const usedPageSlugsPerSpace = new Map<string, Set<string>>();

      // Process each space
      for (const space of spacesToExport) {
        report.logs.push(`Processing space: ${space.name} (${space.key})`);
        this.reportProgress(`Processing space: ${space.name}`, report);

        const pageSlugsForSpace = new Set<string>();
        usedPageSlugsPerSpace.set(space.key, pageSlugsForSpace);

        const spacePath = path.join(outputDir, space.key);

        try {
          // Fetch pages in this space (type=page only, no blogs)
          this.reportProgress(`Fetching pages from space: ${space.name}`, report);
          const pages = await listPagesInSpace(space.key);
          report.logs.push(`  Found ${pages.length} pages in space ${space.key}`);

          if (pages.length >= 500) {
            report.logs.push(`  ⚠ Warning: Space has 500+ pages, may be truncated`);
          }

          // Process each page
          for (const page of pages) {
            try {
              // Fetch full page details with body
              const pageDetail = await getPage(page.id);

              // Extract title and body
              const pageTitle = pageDetail.title;
              const htmlBody = pageDetail.body?.storage?.value || '';

              if (!htmlBody) {
                report.logs.push(`    ⚠ Skipping page ${page.id} - no body content`);
                report.counts.filesSkipped++;
                continue;
              }

              // Convert storage format to Markdown
              let markdown = htmlToMarkdown(htmlBody);

              // Ensure H1 title heading
              markdown = ensureTitleHeading(pageTitle, markdown);

              // Generate slug from title, include pageId for uniqueness
              const baseSlug = slugify(pageTitle);
              const baseFilename = `${baseSlug}--${page.id}.md`;

              // Apply file splitting if configured
              let markdownParts: Array<{ content: string; fileName: string }>;
              if (options.maxCharsPerFile && options.maxCharsPerFile > 0) {
                const parts = splitMarkdown(markdown, baseFilename, options.maxCharsPerFile);
                markdownParts = parts.map(part => ({ content: part.content, fileName: part.fileName }));
              } else {
                markdownParts = [{ content: markdown, fileName: baseFilename }];
              }

              // Write file(s)
              for (const part of markdownParts) {
                const filePath = path.join(spacePath, part.fileName);
                const pathRelative = path.relative(outputDir, filePath);

                const result = await writeFileIdempotent(filePath, part.content);

                const fileResult: FileResult = {
                  // Legacy field
                  path: result.path,
                  // Extended fields
                  pathRelative,
                  pathAbsolute: path.resolve(result.path),
                  status: result.status,
                  bytes: result.bytes,
                  hash: result.hash,
                  sourceId: page.id,
                  error: null,
                  updatedAt: pageDetail.version?.when || null,
                };
                report.files.push(fileResult);

                if (result.status === 'created') {
                  report.counts.filesCreated++;
                } else if (result.status === 'updated') {
                  report.counts.filesUpdated++;
                } else if (result.status === 'skipped') {
                  report.counts.filesSkipped++;
                }
              }

              report.counts.pagesProcessed = (report.counts.pagesProcessed || 0) + 1;

              // Report progress after each page
              this.reportProgress(`Processing pages in ${space.name}...`, report);
            } catch (pageError) {
              const errorMessage = pageError instanceof Error ? pageError.message : 'Unknown error';
              report.logs.push(`    ✗ Failed to process page ${page.id}: ${errorMessage}`);
              report.counts.pagesFailed = (report.counts.pagesFailed || 0) + 1;

              // Record failed file entry
              const failedPath = path.join(spacePath, `${slugify(page.title || 'unknown')}--${page.id}.md`);
              const pathRelative = path.relative(outputDir, failedPath);

              const fileResult: FileResult = {
                // Legacy field
                path: failedPath,
                // Extended fields
                pathRelative,
                pathAbsolute: path.resolve(failedPath),
                status: 'failed',
                bytes: 0,
                hash: null,
                sourceId: page.id,
                error: errorMessage,
                updatedAt: null,
              };
              report.files.push(fileResult);
              report.counts.filesFailed++;

              // Report progress even on failure
              this.reportProgress(`Processing pages in ${space.name}...`, report);
            }
          }
        } catch (spaceError) {
          const errorMessage = spaceError instanceof Error ? spaceError.message : 'Unknown error';
          report.logs.push(`  ✗ Failed to process space ${space.key}: ${errorMessage}`);
        }
      }

      // Finalize report
      this.reportProgress('Finalizing export...', report);
      finalizeReport(report, startTimestamp);
      report.logs.push(`Export completed in ${report.executionTime}s`);
      report.logs.push(`  Pages processed: ${report.counts.pagesProcessed}`);
      report.logs.push(`  Files created: ${report.counts.filesCreated}`);
      report.logs.push(`  Files updated: ${report.counts.filesUpdated}`);
      report.logs.push(`  Files skipped: ${report.counts.filesSkipped}`);

      // Write report files
      this.reportProgress('Writing export report...', report);
      await writeReportJson(report);
      await writeSummaryMarkdown(report);

      this.reportProgress('Export completed', report);
      return report;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      report.logs.push(`✗ Fatal error: ${errorMessage}`);
      report.status = 'failed';
      finalizeReport(report, startTimestamp);

      // Try to write report even on failure
      try {
        await writeReportJson(report);
        await writeSummaryMarkdown(report);
      } catch (reportError) {
        report.logs.push(`Failed to write report: ${reportError}`);
      }

      throw error;
    }
  }
}
