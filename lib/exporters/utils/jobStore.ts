/**
 * In-memory job store for long-running export operations
 * Dev-only implementation - production would use Redis/DB
 */

import { ExportReport } from './report';

export type JobStatus = 'queued' | 'running' | 'completed' | 'failed';

export interface JobProgress {
  categoriesProcessed: number;
  foldersProcessed: number;
  articlesProcessed: number;
  totalCategories?: number;
  totalFolders?: number;
  totalArticles?: number;
}

export interface Job {
  id: string;
  status: JobStatus;
  progress: JobProgress;
  logs: string[];
  error?: string;
  report?: ExportReport;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

// In-memory storage (will be cleared on server restart)
const jobs = new Map<string, Job>();

/**
 * Generate a unique job ID
 */
function generateJobId(): string {
  return `job_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Create a new job
 */
export function createJob(): Job {
  const job: Job = {
    id: generateJobId(),
    status: 'queued',
    progress: {
      categoriesProcessed: 0,
      foldersProcessed: 0,
      articlesProcessed: 0,
    },
    logs: [],
    createdAt: new Date(),
  };

  jobs.set(job.id, job);
  return job;
}

/**
 * Get job by ID
 */
export function getJob(jobId: string): Job | null {
  return jobs.get(jobId) || null;
}

/**
 * Update job status
 */
export function updateJobStatus(jobId: string, status: JobStatus): void {
  const job = jobs.get(jobId);
  if (!job) return;

  job.status = status;

  if (status === 'running' && !job.startedAt) {
    job.startedAt = new Date();
  }

  if ((status === 'completed' || status === 'failed') && !job.completedAt) {
    job.completedAt = new Date();
  }

  jobs.set(jobId, job);
}

/**
 * Update job progress
 */
export function updateJobProgress(
  jobId: string,
  progress: Partial<JobProgress>
): void {
  const job = jobs.get(jobId);
  if (!job) return;

  job.progress = { ...job.progress, ...progress };
  jobs.set(jobId, job);
}

/**
 * Add log entry to job
 */
export function addJobLog(jobId: string, message: string): void {
  const job = jobs.get(jobId);
  if (!job) return;

  const timestamp = new Date().toISOString();
  job.logs.push(`[${timestamp}] ${message}`);

  // Keep only last 100 logs to prevent memory issues
  if (job.logs.length > 100) {
    job.logs = job.logs.slice(-100);
  }

  jobs.set(jobId, job);
}

/**
 * Set job error
 */
export function setJobError(jobId: string, error: string): void {
  const job = jobs.get(jobId);
  if (!job) return;

  job.error = error;
  job.status = 'failed';
  job.completedAt = new Date();
  jobs.set(jobId, job);
}

/**
 * Set job report (on completion)
 */
export function setJobReport(jobId: string, report: ExportReport): void {
  const job = jobs.get(jobId);
  if (!job) return;

  job.report = report;
  jobs.set(jobId, job);
}

/**
 * Clean up old jobs (older than 1 hour)
 * Call this periodically to prevent memory leaks
 */
export function cleanupOldJobs(): void {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;

  for (const [jobId, job] of jobs.entries()) {
    const jobTime = job.completedAt?.getTime() || job.createdAt.getTime();
    if (jobTime < oneHourAgo) {
      jobs.delete(jobId);
    }
  }
}
