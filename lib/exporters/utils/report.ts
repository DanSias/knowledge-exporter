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
  executionTime?: number; // seconds (for convenience)
  outputDir: string;
  status: 'running' | 'completed' | 'failed';

  counts: {
    categoriesProcessed?: number; // Freshdesk only
    foldersProcessed?: number; // Freshdesk only
    articlesProcessed?: number; // Freshdesk only
    pagesProcessed?: number; // Confluence only
    pagesFailed?: number; // Confluence only
    filesCreated: number;
    filesUpdated: number;
    filesSkipped: number;
    filesFailed?: number;
  };

  files: FileResult[];

  options: {
    downloadAssets: boolean;
    maxCharsPerFile?: number;
    languageMode?: 'all' | 'en';
  };

  logs: string[];
}

/**
 * Generate machine-readable JSON report
 */
export async function writeReportJson(report: ExportReport): Promise<void> {
  const reportPath = path.join(report.outputDir, 'report.json');
  const content = JSON.stringify(report, null, 2);
  await writeFileIdempotent(reportPath, content);
}

/**
 * Generate human-readable Markdown summary
 */
export async function writeSummaryMarkdown(report: ExportReport): Promise<void> {
  const summaryPath = path.join(report.outputDir, 'SUMMARY.md');

  const durationSec = (report.duration / 1000).toFixed(2);

  let content = `# Export Summary

**Started:** ${report.startTime}
**Completed:** ${report.endTime}
**Duration:** ${durationSec}s

## Statistics

`;

  // Add provider-specific stats
  if (report.counts.categoriesProcessed !== undefined) {
    content += `- **Categories Processed:** ${report.counts.categoriesProcessed}\n`;
  }
  if (report.counts.foldersProcessed !== undefined) {
    content += `- **Folders Processed:** ${report.counts.foldersProcessed}\n`;
  }
  if (report.counts.articlesProcessed !== undefined) {
    content += `- **Articles Processed:** ${report.counts.articlesProcessed}\n`;
  }
  if (report.counts.pagesProcessed !== undefined) {
    content += `- **Pages Processed:** ${report.counts.pagesProcessed}\n`;
  }
  if (report.counts.pagesFailed !== undefined && report.counts.pagesFailed > 0) {
    content += `- **Pages Failed:** ${report.counts.pagesFailed}\n`;
  }

  content += `

## Files

- **Created:** ${report.counts.filesCreated}
- **Updated:** ${report.counts.filesUpdated}
- **Skipped:** ${report.counts.filesSkipped}
- **Failed:** ${report.counts.filesFailed || 0}

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
  content += `## Output Directory\n\n\`${path.resolve(report.outputDir)}\`\n`;

  // Add logs section if any
  if (report.logs && report.logs.length > 0) {
    content += `\n## Export Logs\n\n\`\`\`\n`;
    for (const log of report.logs) {
      content += `${log}\n`;
    }
    content += `\`\`\`\n`;
  }

  await writeFileIdempotent(summaryPath, content);
}

/**
 * Create initial empty report
 */
export function createReport(
  outputDir: string,
  options: { downloadAssets: boolean; maxCharsPerFile?: number; languageMode?: 'all' | 'en' }
): ExportReport {
  return {
    startTime: new Date().toISOString(),
    endTime: '',
    duration: 0,
    outputDir,
    status: 'running',
    counts: {
      categoriesProcessed: 0,
      foldersProcessed: 0,
      articlesProcessed: 0,
      pagesProcessed: 0,
      pagesFailed: 0,
      filesCreated: 0,
      filesUpdated: 0,
      filesSkipped: 0,
      filesFailed: 0,
    },
    files: [],
    options,
    logs: [],
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
  const durationMs = endTime.getTime() - startTimestamp;
  return {
    ...report,
    endTime: endTime.toISOString(),
    duration: durationMs,
    executionTime: Math.round(durationMs / 1000),
    status: report.status === 'failed' ? 'failed' : 'completed',
  };
}
