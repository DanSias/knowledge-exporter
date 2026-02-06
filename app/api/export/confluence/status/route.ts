import { NextResponse } from 'next/server';
import { getJob } from '@/lib/jobs/confluenceJobStore';

/**
 * GET /api/export/confluence/status?jobId=xxx
 * Check status of a Confluence export job
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json({ error: 'jobId parameter is required' }, { status: 400 });
    }

    const job = getJob(jobId);

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    return NextResponse.json({
      jobId: job.jobId,
      status: job.status,
      report: job.report,
      error: job.error,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      phase: job.phase,
      progress: job.progress,
    });
  } catch (error) {
    console.error('Failed to get job status:', error);
    return NextResponse.json(
      { error: 'Failed to get job status', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
