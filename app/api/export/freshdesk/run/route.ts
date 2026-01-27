/**
 * Run export endpoint
 * POST /api/export/freshdesk/run
 */

import { NextRequest, NextResponse } from 'next/server';
import { FreshdeskExporter } from '@/lib/exporters/freshdesk/exporter';
import { ExportScope, ExportOptions } from '@/lib/exporters/types';
import {
  createJob,
  updateJobStatus,
  updateJobProgress,
  addJobLog,
  setJobError,
  setJobReport,
} from '@/lib/exporters/utils/jobStore';

interface RunRequest {
  scope: ExportScope;
  options: ExportOptions;
}

export async function POST(request: NextRequest) {
  try {
    const body: RunRequest = await request.json();

    // Validate request
    if (!body.scope || !body.options) {
      return NextResponse.json(
        { error: 'Missing scope or options' },
        { status: 400 }
      );
    }

    // Create job
    const job = createJob();

    // Start export in background (don't await)
    runExportJob(job.id, body.scope, body.options).catch((error) => {
      console.error('Export job failed:', error);
      setJobError(job.id, error instanceof Error ? error.message : 'Unknown error');
    });

    // Return job ID immediately
    return NextResponse.json({ jobId: job.id });
  } catch (error) {
    console.error('Failed to start export:', error);
    return NextResponse.json(
      { error: 'Failed to start export' },
      { status: 500 }
    );
  }
}

/**
 * Run export job in background
 */
async function runExportJob(
  jobId: string,
  scope: ExportScope,
  options: ExportOptions
): Promise<void> {
  try {
    updateJobStatus(jobId, 'running');
    addJobLog(jobId, 'Export started');

    const exporter = new FreshdeskExporter();

    // Note: For now, we'll run synchronously
    // In production, this would use a proper job queue
    const report = await exporter.run(scope, options);

    // Update job with results
    setJobReport(jobId, report);
    updateJobProgress(jobId, {
      categoriesProcessed: report.counts.categoriesProcessed,
      foldersProcessed: report.counts.foldersProcessed,
      articlesProcessed: report.counts.articlesProcessed,
    });

    addJobLog(jobId, `Export completed: ${report.counts.articlesProcessed} articles processed`);
    updateJobStatus(jobId, 'completed');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    addJobLog(jobId, `Export failed: ${errorMessage}`);
    setJobError(jobId, errorMessage);
  }
}
