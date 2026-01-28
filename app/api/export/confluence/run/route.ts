import { NextResponse } from 'next/server';
import { ConfluenceExporter } from '@/lib/exporters/confluence/exporter';
import { ExportScope, ExportOptions } from '@/lib/exporters/types';
import { createJob, updateJob, cleanupOldJobs } from '@/lib/jobs/confluenceJobStore';

/**
 * POST /api/export/confluence/run
 * Start a Confluence export job
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const scope: ExportScope = {
      exportAll: body.exportAll ?? true,
      spaceIds: body.spaceIds || [],
    };

    const options: ExportOptions = {
      outputDir: body.outputDir || './exports/confluence-kb',
      downloadAssets: body.downloadAssets ?? false,
      maxCharsPerFile: body.maxCharsPerFile ? parseInt(body.maxCharsPerFile, 10) : undefined,
    };

    // Clean up old jobs
    cleanupOldJobs();

    // Create new job
    const jobId = createJob();

    // Run export in background (non-blocking)
    const exporter = new ConfluenceExporter();
    exporter
      .run(scope, options)
      .then((report) => {
        updateJob(jobId, 'completed', report);
      })
      .catch((error) => {
        console.error('Export failed:', error);
        updateJob(jobId, 'failed', undefined, error instanceof Error ? error.message : 'Unknown error');
      });

    return NextResponse.json({ jobId });
  } catch (error) {
    console.error('Failed to start export:', error);
    return NextResponse.json(
      { error: 'Failed to start export', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
