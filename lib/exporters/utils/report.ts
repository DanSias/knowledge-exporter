/**
 * Export report generation utilities
 */

import { writeFileIdempotent } from './fileWriter';
import path from 'path';

export interface FileResult {
  path: string;
  status: 'created' | 'updated' | 'skipped' | 'failed';
  error?: string;
  articleId?: number;
  articleTitle?: string;
}

export interface ExportReport {
  startTime: string;
  endTime: string;
  duration: number; // milliseconds
  outputDir: string;

  counts: {
    categoriesProcessed: number;
    foldersProcessed: number;
    articlesProcessed: number;
    filesCreated: number;
    filesUpdated: number;
    filesSkipped: number;
    filesFailed: number;
  };

  files: FileResult[];

  options: {
    downloadAssets: boolean;
    maxCharsPerFile?: number;
  };
}

/**
 * Generate machine-readable JSON report
 */
export async function writeReportJson(
  outputDir: string,
  report: ExportReport
): Promise<void> {
  const reportPath = path.join(outputDir, 'report.json');
  const content = JSON.stringify(report, null, 2);
  await writeFileIdempotent(reportPath, content);
}

/**
 * Generate human-readable Markdown summary
 */
export async function writeSummaryMarkdown(
  outputDir: string,
  report: ExportReport
): Promise<void> {
  const summaryPath = path.join(outputDir, 'SUMMARY.md');

  const durationSec = (report.duration / 1000).toFixed(2);

  let content = `# Export Summary

**Started:** ${report.startTime}
**Completed:** ${report.endTime}
**Duration:** ${durationSec}s

## Statistics

- **Categories Processed:** ${report.counts.categoriesProcessed}
- **Folders Processed:** ${report.counts.foldersProcessed}
- **Articles Processed:** ${report.counts.articlesProcessed}

## Files

- **Created:** ${report.counts.filesCreated}
- **Updated:** ${report.counts.filesUpdated}
- **Skipped:** ${report.counts.filesSkipped}
- **Failed:** ${report.counts.filesFailed}

## Options

- **Download Assets:** ${report.options.downloadAssets ? 'Yes' : 'No'}
- **Max Chars Per File:** ${report.options.maxCharsPerFile || 'Unlimited'}

`;

  // Add failed files section if any
  const failedFiles = report.files.filter((f) => f.status === 'failed');
  if (failedFiles.length > 0) {
    content += `## Failed Files\n\n`;

    for (const file of failedFiles) {
      content += `### ${file.articleTitle || 'Unknown'}\n\n`;
      content += `- **Path:** \`${file.path}\`\n`;
      content += `- **Error:** ${file.error || 'Unknown error'}\n\n`;
    }
  }

  // Add output directory
  content += `## Output Directory\n\n\`${path.resolve(outputDir)}\`\n`;

  await writeFileIdempotent(summaryPath, content);
}

/**
 * Create initial empty report
 */
export function createReport(
  outputDir: string,
  options: { downloadAssets: boolean; maxCharsPerFile?: number }
): ExportReport {
  return {
    startTime: new Date().toISOString(),
    endTime: '',
    duration: 0,
    outputDir,
    counts: {
      categoriesProcessed: 0,
      foldersProcessed: 0,
      articlesProcessed: 0,
      filesCreated: 0,
      filesUpdated: 0,
      filesSkipped: 0,
      filesFailed: 0,
    },
    files: [],
    options,
  };
}

/**
 * Finalize report with end time and duration
 */
export function finalizeReport(
  report: ExportReport,
  startTimestamp: number
): ExportReport {
  const endTime = new Date();
  return {
    ...report,
    endTime: endTime.toISOString(),
    duration: endTime.getTime() - startTimestamp,
  };
}
