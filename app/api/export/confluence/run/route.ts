import { NextResponse } from 'next/server';
import { ConfluenceExporter } from '@/lib/exporters/confluence/exporter';
import { ExportScope, ExportOptions } from '@/lib/exporters/types';
import { createJob, updateJob, updateJobProgress, cleanupOldJobs } from '@/lib/jobs/confluenceJobStore';

/**
 * POST /api/export/confluence/run
 * Start a Confluence export job
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // DEBUG LOGGING (dev-only)
    if (process.env.NODE_ENV !== 'production') {
      console.log('[run/route] Debug - Received body:', body);
    }

    // Accept nested structure from useExportJob: { scope: {...}, options: {...} }
    const scopeData = body.scope || body;
    const optionsData = body.options || body;

    const scope: ExportScope = {
      exportAll: scopeData.exportAll ?? false, // NEVER default to true
      spaceKeys: scopeData.spaceKeys || [],
    };

    // Server-side validation guard: prevent accidental export-all
    if (!scope.exportAll && (!scope.spaceKeys || scope.spaceKeys.length === 0)) {
      return NextResponse.json(
        {
          error: 'Invalid export scope',
          details: 'Must enable exportAll or provide at least one spaceKey'
        },
        { status: 400 }
      );
    }

    const options: ExportOptions = {
      outputDir: optionsData.outputDir || './exports', // Base directory (exporter adds provider/runName)
      runName: optionsData.runName, // Optional run name (auto-generated if not provided)
      downloadAssets: optionsData.downloadAssets ?? false,
      maxCharsPerFile: optionsData.maxCharsPerFile ? parseInt(optionsData.maxCharsPerFile, 10) : undefined,
      includeTitleAsH1: optionsData.includeTitleAsH1,
      normalizeHeadings: optionsData.normalizeHeadings,
      collapseBlankLines: optionsData.collapseBlankLines,
      stripEmptySections: optionsData.stripEmptySections,
    };

    // Clean up old jobs
    cleanupOldJobs();

    // Create new job
    const jobId = createJob();

    // Run export in background (non-blocking)
    const exporter = new ConfluenceExporter();

    // Set up progress callback
    exporter.setProgressCallback((phase, progress) => {
      updateJobProgress(jobId, phase, progress);
    });

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
