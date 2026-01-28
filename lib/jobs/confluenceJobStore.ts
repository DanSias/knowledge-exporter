/**
 * In-memory job store for Confluence export jobs
 * Simple store without persistence - jobs lost on server restart
 */

import { ExportReport } from '../exporters/utils/report';

export interface ConfluenceExportJob {
  jobId: string;
  status: 'running' | 'completed' | 'failed';
  report: ExportReport | null;
  error?: string;
  createdAt: number;
  updatedAt: number;
}

const jobs = new Map<string, ConfluenceExportJob>();

/**
 * Create a new job and return its ID
 */
export function createJob(): string {
  const jobId = `confluence-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const now = Date.now();

  jobs.set(jobId, {
    jobId,
    status: 'running',
    report: null,
    createdAt: now,
    updatedAt: now,
  });

  return jobId;
}

/**
 * Get a job by ID
 */
export function getJob(jobId: string): ConfluenceExportJob | null {
  return jobs.get(jobId) || null;
}

/**
 * Update a job with new status and report
 */
export function updateJob(
  jobId: string,
  status: 'running' | 'completed' | 'failed',
  report?: ExportReport,
  error?: string
): void {
  const job = jobs.get(jobId);
  if (!job) {
    throw new Error(`Job ${jobId} not found`);
  }

  job.status = status;
  job.updatedAt = Date.now();

  if (report) {
    job.report = report;
  }

  if (error) {
    job.error = error;
  }

  jobs.set(jobId, job);
}

/**
 * Clean up old jobs (older than 1 hour)
 */
export function cleanupOldJobs(): void {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;

  for (const [jobId, job] of jobs.entries()) {
    if (job.updatedAt < oneHourAgo) {
      jobs.delete(jobId);
    }
  }
}
