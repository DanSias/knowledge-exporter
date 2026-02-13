import { useState, useEffect, useRef } from 'react';

export interface JobStatus {
  // Common fields
  id?: string;
  jobId?: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  error?: string;
  createdAt?: string;
  startedAt?: string;
  completedAt?: string;
  updatedAt?: string;

  // Freshdesk-specific
  progress?: {
    categoriesProcessed: number;
    foldersProcessed: number;
    articlesProcessed: number;
    pagesProcessed?: number;
    pagesFailed?: number;
    filesCreated?: number;
    filesUpdated?: number;
    filesSkipped?: number;
    filesFailed?: number;
  };
  logs?: string[];

  // Confluence-specific
  phase?: string;
  report?: {
    status: string;
    outputDir: string;
    executionTime?: number;
    counts: {
      pagesProcessed?: number;
      pagesFailed?: number;
      filesCreated: number;
      filesUpdated: number;
      filesSkipped: number;
      filesFailed?: number;
    };
    files?: Array<{
      // Legacy fields
      path: string;
      status: string;
      error?: string;
      articleTitle?: string;
      // Extended fields for diff & change awareness
      pathRelative?: string;
      pathAbsolute?: string;
      bytes?: number;
      hash?: string | null;
      sourceId?: string | null;
      updatedAt?: string | null;
    }>;
    logs?: string[];
    markdownOptions?: {
      includeTitleAsH1: boolean;
      normalizeHeadings: boolean;
      collapseBlankLines: boolean;
      stripEmptySections: boolean;
    };
  };
}

export interface ExportScope {
  exportAll: boolean;
  categoryIds?: number[]; // Freshdesk
  spaceKeys?: string[]; // Confluence
}

export interface ExportOptions {
  outputDir: string;
  runName?: string;
  downloadAssets?: boolean;
  maxCharsPerFile?: number;
  languageMode?: 'all' | 'en';
  includeTitleAsH1?: boolean;
  normalizeHeadings?: boolean;
  collapseBlankLines?: boolean;
  stripEmptySections?: boolean;
}

export function useExportJob(provider: 'freshdesk' | 'confluence') {
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startJob = async (scope: ExportScope, options: ExportOptions) => {
    const response = await fetch(`/api/export/${provider}/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scope, options }),
    });

    if (!response.ok) {
      // Parse error response to show server-provided error message
      const errorData = await response.json().catch(() => ({ error: 'Failed to start export' }));
      const errorMessage = errorData.details
        ? `${errorData.error}: ${errorData.details}`
        : errorData.error || 'Failed to start export';
      throw new Error(errorMessage);
    }

    const data = await response.json();
    const id = data.jobId;
    setJobId(id);

    // Immediately fetch initial status
    await fetchJobStatus(id);

    return id;
  };

  const fetchJobStatus = async (id: string) => {
    try {
      const response = await fetch(`/api/export/${provider}/status?jobId=${id}`);

      if (!response.ok) {
        throw new Error('Failed to fetch job status');
      }

      const data: JobStatus = await response.json();
      setJobStatus(data);

      return data;
    } catch (error) {
      console.error('Failed to fetch job status:', error);
      return null;
    }
  };

  // Poll job status when job is running
  useEffect(() => {
    if (jobId && jobStatus?.status === 'running') {
      const interval = provider === 'confluence' ? 750 : 1000;
      pollIntervalRef.current = setInterval(() => {
        fetchJobStatus(jobId);
      }, interval);
    } else {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [jobId, jobStatus?.status, provider]);

  const resetJob = () => {
    setJobId(null);
    setJobStatus(null);
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };

  return {
    jobId,
    jobStatus,
    startJob,
    resetJob,
  };
}
