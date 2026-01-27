'use client';

import { useState, useEffect, useRef } from 'react';
import { Alert } from '@/app/components/Alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/Card';
import { StepIndicator, Step } from '@/app/components/StepIndicator';
import { PreviewResult } from '@/lib/exporters/types';

interface ExportWizardProps {
  hasApiKey: boolean;
  hasHost: boolean;
  baseUrl: string | null;
}

interface JobStatus {
  id: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  progress: {
    categoriesProcessed: number;
    foldersProcessed: number;
    articlesProcessed: number;
  };
  logs: string[];
  error?: string;
  report?: {
    counts: {
      filesCreated: number;
      filesUpdated: number;
      filesSkipped: number;
      filesFailed: number;
    };
    files: Array<{
      path: string;
      status: string;
      error?: string;
      articleTitle?: string;
    }>;
    outputDir: string;
  };
}

export function ExportWizard({ hasApiKey, hasHost, baseUrl }: ExportWizardProps) {
  const isConfigured = hasApiKey && hasHost;

  // State for step progression
  const [currentStep, setCurrentStep] = useState<number>(isConfigured ? 2 : 1);

  // State for preview data
  const [previewData, setPreviewData] = useState<PreviewResult | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // State for scope selection (Step 2)
  const [exportAll, setExportAll] = useState(true);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<Set<number>>(new Set());

  // State for options (Step 3)
  const [outputDir, setOutputDir] = useState('./exports/freshdesk-kb');
  const [downloadAssets, setDownloadAssets] = useState(false);
  const [maxCharsPerFile, setMaxCharsPerFile] = useState('');

  // State for job execution (Step 4)
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch preview when moving to step 2
  useEffect(() => {
    if (currentStep === 2 && !previewData && !previewLoading && !previewError) {
      fetchPreview();
    }
  }, [currentStep]);

  // Poll job status when job is running
  useEffect(() => {
    if (jobId && jobStatus?.status === 'running') {
      pollIntervalRef.current = setInterval(() => {
        fetchJobStatus(jobId);
      }, 1000);
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
  }, [jobId, jobStatus?.status]);

  const fetchPreview = async () => {
    setPreviewLoading(true);
    setPreviewError(null);

    try {
      const response = await fetch('/api/export/freshdesk/preview');

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.details || 'Failed to fetch preview');
      }

      const data: PreviewResult = await response.json();
      setPreviewData(data);
    } catch (error) {
      console.error('Preview fetch error:', error);
      setPreviewError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setPreviewLoading(false);
    }
  };

  const startExport = async () => {
    try {
      const scope = {
        exportAll,
        categoryIds: exportAll ? undefined : Array.from(selectedCategoryIds),
      };

      const options = {
        outputDir,
        downloadAssets,
        maxCharsPerFile: maxCharsPerFile ? parseInt(maxCharsPerFile, 10) : undefined,
      };

      const response = await fetch('/api/export/freshdesk/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scope, options }),
      });

      if (!response.ok) {
        throw new Error('Failed to start export');
      }

      const data = await response.json();
      setJobId(data.jobId);
      setCurrentStep(4);

      // Start polling
      fetchJobStatus(data.jobId);
    } catch (error) {
      console.error('Failed to start export:', error);
      alert('Failed to start export: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const fetchJobStatus = async (id: string) => {
    try {
      const response = await fetch(`/api/export/freshdesk/status?jobId=${id}`);

      if (!response.ok) {
        throw new Error('Failed to fetch job status');
      }

      const data: JobStatus = await response.json();
      setJobStatus(data);

      // If job completed or failed, move to step 5
      if ((data.status === 'completed' || data.status === 'failed') && currentStep === 4) {
        setCurrentStep(5);
      }
    } catch (error) {
      console.error('Failed to fetch job status:', error);
    }
  };

  const toggleCategory = (categoryId: number) => {
    const newSet = new Set(selectedCategoryIds);
    if (newSet.has(categoryId)) {
      newSet.delete(categoryId);
    } else {
      newSet.add(categoryId);
    }
    setSelectedCategoryIds(newSet);
  };

  const toggleSelectAll = () => {
    if (!previewData) return;

    if (selectedCategoryIds.size === previewData.categories.length) {
      setSelectedCategoryIds(new Set());
    } else {
      setSelectedCategoryIds(new Set(previewData.categories.map((c) => c.id)));
    }
  };

  const steps: Step[] = [
    { number: 1, title: 'Configure', status: currentStep > 1 ? 'complete' : 'current' },
    { number: 2, title: 'Scope', status: currentStep === 2 ? 'current' : currentStep > 2 ? 'complete' : 'pending' },
    { number: 3, title: 'Options', status: currentStep === 3 ? 'current' : currentStep > 3 ? 'complete' : 'pending' },
    { number: 4, title: 'Run', status: currentStep === 4 ? 'current' : currentStep > 4 ? 'complete' : 'pending' },
    { number: 5, title: 'Results', status: currentStep === 5 ? 'current' : 'pending' },
  ];

  const failedFiles = jobStatus?.report?.files.filter((f) => f.status === 'failed') || [];

  return (
    <div className="space-y-6">
      <StepIndicator steps={steps} />

      {/* Step 1: Configure */}
      {currentStep >= 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 1: Configure</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="mb-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Environment Variables
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
                    <span className="font-mono text-sm text-zinc-600 dark:text-zinc-400">
                      FRESHDESK_API_KEY
                    </span>
                    <span className={`text-sm font-medium ${hasApiKey ? 'text-green-600 dark:text-green-400' : 'text-zinc-400 dark:text-zinc-600'}`}>
                      {hasApiKey ? '✓ Present' : '✗ Missing'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
                    <span className="font-mono text-sm text-zinc-600 dark:text-zinc-400">
                      FRESHDESK_HOST or FRESHDESK_DOMAIN
                    </span>
                    <span className={`text-sm font-medium ${hasHost ? 'text-green-600 dark:text-green-400' : 'text-zinc-400 dark:text-zinc-600'}`}>
                      {hasHost ? '✓ Present' : '✗ Missing'}
                    </span>
                  </div>
                </div>
              </div>

              {baseUrl && (
                <div>
                  <h4 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Resolved Base URL
                  </h4>
                  <div className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
                    <code className="text-sm text-zinc-900 dark:text-zinc-100">{baseUrl}</code>
                  </div>
                </div>
              )}

              {!isConfigured && (
                <Alert variant="warning">
                  <p className="font-medium">Missing required configuration</p>
                  <p className="mt-1">Please set the following environment variables to continue:</p>
                  <ul className="mt-2 list-inside list-disc space-y-1 text-sm">
                    {!hasApiKey && <li><code className="font-mono">FRESHDESK_API_KEY</code></li>}
                    {!hasHost && <li><code className="font-mono">FRESHDESK_HOST</code> or <code className="font-mono">FRESHDESK_DOMAIN</code></li>}
                  </ul>
                </Alert>
              )}

              {isConfigured && currentStep === 1 && (
                <>
                  <Alert variant="success">
                    <p className="font-medium">Configuration complete</p>
                    <p className="mt-1 text-sm">All required environment variables are present.</p>
                  </Alert>
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    Continue to Scope Selection
                  </button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Select Scope */}
      {currentStep >= 2 && isConfigured && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Step 2: Select Scope</CardTitle>
              {currentStep > 2 && (
                <button onClick={() => setCurrentStep(2)} className="text-sm text-blue-600 hover:text-blue-700">
                  Edit
                </button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {previewLoading && (
                <Alert variant="info">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                    <span>Loading categories from Freshdesk...</span>
                  </div>
                </Alert>
              )}

              {previewError && (
                <Alert variant="error">
                  <p className="font-medium">Failed to load preview</p>
                  <p className="mt-1 text-sm">{previewError}</p>
                  <button onClick={fetchPreview} className="mt-2 text-sm font-medium underline">
                    Retry
                  </button>
                </Alert>
              )}

              {previewData && !previewLoading && (
                <>
                  <div className="flex items-center justify-between rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
                    <div>
                      <label htmlFor="export-all" className="font-medium text-zinc-900 dark:text-zinc-100">
                        Export all categories
                      </label>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Export all {previewData.categories.length} categories
                      </p>
                    </div>
                    <input
                      id="export-all"
                      type="checkbox"
                      checked={exportAll}
                      onChange={(e) => setExportAll(e.target.checked)}
                      disabled={currentStep > 2}
                      className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                    />
                  </div>

                  {!exportAll && (
                    <div>
                      <div className="mb-3 flex items-center justify-between">
                        <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                          Select Categories ({selectedCategoryIds.size} selected)
                        </h4>
                        {currentStep === 2 && (
                          <button
                            onClick={toggleSelectAll}
                            className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
                          >
                            {selectedCategoryIds.size === previewData.categories.length ? 'Deselect All' : 'Select All'}
                          </button>
                        )}
                      </div>

                      <div className="space-y-2">
                        {previewData.categories.map((category) => (
                          <div
                            key={category.id}
                            className="grid grid-cols-[auto_1fr_auto] gap-4 rounded-md border border-zinc-200 bg-white px-4 py-3 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-950"
                          >
                            <input
                              type="checkbox"
                              checked={selectedCategoryIds.has(category.id)}
                              onChange={() => toggleCategory(category.id)}
                              disabled={currentStep > 2}
                              className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                            />
                            <div>
                              <div className="font-medium text-zinc-900 dark:text-zinc-100">
                                {category.name}
                              </div>
                              <div className="text-sm text-zinc-500 dark:text-zinc-500">
                                {category.folderCount} folders · {category.articleCount} total articles
                              </div>
                            </div>
                            <div className="text-right font-medium text-zinc-900 dark:text-zinc-100">
                              {category.englishPublishedArticleCount}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {currentStep === 2 && (
                    <>
                      <Alert variant="info">
                        <p className="font-medium">
                          {exportAll
                            ? `Ready to export all categories`
                            : `Ready to export ${selectedCategoryIds.size} selected ${selectedCategoryIds.size === 1 ? 'category' : 'categories'}`}
                        </p>
                        <p className="mt-1 text-sm">
                          Total English published articles:{' '}
                          {exportAll
                            ? previewData.categories.reduce((sum, c) => sum + c.englishPublishedArticleCount, 0)
                            : previewData.categories
                                .filter((c) => selectedCategoryIds.has(c.id))
                                .reduce((sum, c) => sum + c.englishPublishedArticleCount, 0)}
                        </p>
                      </Alert>
                      <button
                        onClick={() => setCurrentStep(3)}
                        disabled={!exportAll && selectedCategoryIds.size === 0}
                        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Continue to Options
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Options */}
      {currentStep >= 3 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Step 3: Options</CardTitle>
              {currentStep > 3 && (
                <button onClick={() => setCurrentStep(3)} className="text-sm text-blue-600 hover:text-blue-700">
                  Edit
                </button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label htmlFor="outputDir" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Output Directory
                </label>
                <input
                  id="outputDir"
                  type="text"
                  value={outputDir}
                  onChange={(e) => setOutputDir(e.target.value)}
                  disabled={currentStep > 3}
                  className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  placeholder="./exports/freshdesk-kb"
                />
                <p className="mt-1 text-xs text-zinc-500">Path where exported files will be saved</p>
              </div>

              <div className="flex items-center justify-between rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
                <div>
                  <label htmlFor="downloadAssets" className="font-medium text-zinc-900 dark:text-zinc-100">
                    Download assets
                  </label>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Download images and attachments locally (best-effort)
                  </p>
                </div>
                <input
                  id="downloadAssets"
                  type="checkbox"
                  checked={downloadAssets}
                  onChange={(e) => setDownloadAssets(e.target.checked)}
                  disabled={currentStep > 3}
                  className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                />
              </div>

              <div>
                <label htmlFor="maxCharsPerFile" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Max Characters Per File (optional)
                </label>
                <input
                  id="maxCharsPerFile"
                  type="number"
                  value={maxCharsPerFile}
                  onChange={(e) => setMaxCharsPerFile(e.target.value)}
                  disabled={currentStep > 3}
                  className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  placeholder="Leave empty for unlimited"
                />
                <p className="mt-1 text-xs text-zinc-500">
                  Split large articles into multiple files (e.g., 50000)
                </p>
              </div>

              {currentStep === 3 && (
                <button
                  onClick={() => setCurrentStep(4)}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Continue to Run Export
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Run */}
      {currentStep >= 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 4: Run Export</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {!jobId && (
                <button
                  onClick={startExport}
                  className="rounded-md bg-green-600 px-6 py-3 text-sm font-medium text-white hover:bg-green-700"
                >
                  Start Export
                </button>
              )}

              {jobStatus && (
                <>
                  <div className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
                    <div className="flex items-center gap-2">
                      <div className={`h-3 w-3 rounded-full ${
                        jobStatus.status === 'running' ? 'bg-blue-500 animate-pulse' :
                        jobStatus.status === 'completed' ? 'bg-green-500' :
                        jobStatus.status === 'failed' ? 'bg-red-500' :
                        'bg-zinc-400'
                      }`}></div>
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">
                        Status: {jobStatus.status.charAt(0).toUpperCase() + jobStatus.status.slice(1)}
                      </span>
                    </div>
                  </div>

                  {jobStatus.status === 'running' && (
                    <div>
                      <h4 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">Progress</h4>
                      <div className="space-y-2 rounded-md border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
                        <div className="flex justify-between text-sm">
                          <span className="text-zinc-600 dark:text-zinc-400">Categories</span>
                          <span className="font-medium text-zinc-900 dark:text-zinc-100">{jobStatus.progress.categoriesProcessed}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-zinc-600 dark:text-zinc-400">Folders</span>
                          <span className="font-medium text-zinc-900 dark:text-zinc-100">{jobStatus.progress.foldersProcessed}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-zinc-600 dark:text-zinc-400">Articles</span>
                          <span className="font-medium text-zinc-900 dark:text-zinc-100">{jobStatus.progress.articlesProcessed}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {jobStatus.logs.length > 0 && (
                    <div>
                      <h4 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">Recent Logs</h4>
                      <div className="rounded-md border border-zinc-200 bg-zinc-950 px-4 py-3 font-mono text-xs text-green-400">
                        {jobStatus.logs.map((log, i) => (
                          <div key={i}>{log}</div>
                        ))}
                      </div>
                    </div>
                  )}

                  {jobStatus.error && (
                    <Alert variant="error">
                      <p className="font-medium">Export failed</p>
                      <p className="mt-1 text-sm">{jobStatus.error}</p>
                    </Alert>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 5: Results */}
      {currentStep === 5 && jobStatus?.report && (
        <Card>
          <CardHeader>
            <CardTitle>Step 5: Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert variant={jobStatus.status === 'completed' ? 'success' : 'error'}>
                <p className="font-medium">
                  {jobStatus.status === 'completed' ? 'Export completed successfully' : 'Export completed with errors'}
                </p>
              </Alert>

              <div>
                <h4 className="mb-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">Statistics</h4>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <div className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {jobStatus.report.counts.filesCreated}
                    </div>
                    <div className="text-sm text-zinc-600 dark:text-zinc-400">Created</div>
                  </div>
                  <div className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {jobStatus.report.counts.filesUpdated}
                    </div>
                    <div className="text-sm text-zinc-600 dark:text-zinc-400">Updated</div>
                  </div>
                  <div className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
                    <div className="text-2xl font-bold text-zinc-600 dark:text-zinc-400">
                      {jobStatus.report.counts.filesSkipped}
                    </div>
                    <div className="text-sm text-zinc-600 dark:text-zinc-400">Skipped</div>
                  </div>
                  <div className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {jobStatus.report.counts.filesFailed}
                    </div>
                    <div className="text-sm text-zinc-600 dark:text-zinc-400">Failed</div>
                  </div>
                </div>
              </div>

              {failedFiles.length > 0 && (
                <div>
                  <h4 className="mb-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">Failed Files</h4>
                  <div className="space-y-2">
                    {failedFiles.map((file, i) => (
                      <div key={i} className="rounded-md border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900 dark:bg-red-950">
                        <div className="font-medium text-red-900 dark:text-red-100">{file.articleTitle || 'Unknown'}</div>
                        <div className="mt-1 text-sm text-red-700 dark:text-red-300">{file.error}</div>
                        <div className="mt-1 font-mono text-xs text-red-600 dark:text-red-400">{file.path}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">Output Directory</h4>
                <div className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
                  <code className="text-sm text-zinc-900 dark:text-zinc-100">{jobStatus.report.outputDir}</code>
                </div>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                  Open this folder in your file manager to view exported files
                </p>
              </div>

              <Alert variant="info">
                <p className="text-sm">
                  <strong>Files generated:</strong> report.json (machine-readable) and SUMMARY.md (human-readable) in the output directory
                </p>
              </Alert>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
