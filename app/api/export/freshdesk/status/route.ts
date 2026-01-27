/**
 * Export status endpoint
 * GET /api/export/freshdesk/status?jobId=xxx
 */

import { NextRequest, NextResponse } from 'next/server';
import { getJob } from '@/lib/exporters/utils/jobStore';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json({ error: 'Missing jobId' }, { status: 400 });
    }

    const job = getJob(jobId);

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Return job details
    return NextResponse.json({
      id: job.id,
      status: job.status,
      progress: job.progress,
      logs: job.logs.slice(-20), // Return last 20 logs
      error: job.error,
      report: job.report,
      createdAt: job.createdAt,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
    });
  } catch (error) {
    console.error('Failed to get job status:', error);
    return NextResponse.json(
      { error: 'Failed to get job status' },
      { status: 500 }
    );
  }
}
