'use client';

import { useState, useEffect } from 'react';
import { Alert } from '@/app/components/Alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/Card';

interface Space {
  id: string;
  key: string;
  name: string;
  type: string;
  status: string;
}

interface PreviewResult {
  site: string;
  spaces: Space[];
  totals: {
    spaceCount: number;
  };
}

interface JobStatus {
  jobId: string;
  status: 'running' | 'completed' | 'failed';
  report: {
    status: string;
    outputDir: string;
    executionTime?: number;
    counts: {
      pagesProcessed: number;
      pagesFailed: number;
      filesCreated: number;
      filesUpdated: number;
      filesSkipped: number;
    };
    logs: string[];
  } | null;
  error?: string;
}

interface ConfluenceExportClientProps {
  hasSite: boolean;
  hasEmail: boolean;
  hasApiToken: boolean;
  siteUrl: string | null;
}

export function ConfluenceExportClient({
  hasSite,
  hasEmail,
  hasApiToken,
  siteUrl,
}: ConfluenceExportClientProps) {
  const isConfigured = hasSite && hasEmail && hasApiToken;

  // State management
  const [currentStep, setCurrentStep] = useState<number>(isConfigured ? 2 : 1);
  const [exportAll, setExportAll] = useState(true);
  const [selectedSpaceIds, setSelectedSpaceIds] = useState<Set<string>>(new Set());
  const [showPersonalSpaces, setShowPersonalSpaces] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [previewData, setPreviewData] = useState<PreviewResult | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // Export options
  const [outputDir, setOutputDir] = useState('./exports/confluence-kb');
  const [downloadAssets, setDownloadAssets] = useState(false);
  const [maxCharsPerFile, setMaxCharsPerFile] = useState('');

  // Job state
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [jobPolling, setJobPolling] = useState(false);

  // Fetch preview when moving to step 2
  useEffect(() => {
    if (currentStep === 2 && !previewData && !previewLoading && !previewError) {
      fetchPreview();
    }
  }, [currentStep, previewData, previewLoading, previewError]);

  // Poll job status when job is running
  useEffect(() => {
    if (jobId && jobPolling) {
      const interval = setInterval(() => {
        fetchJobStatus(jobId);
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [jobId, jobPolling]);

  const fetchPreview = async () => {
    setPreviewLoading(true);
    setPreviewError(null);

    try {
      const response = await fetch('/api/confluence/preview');

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

  const toggleSpace = (spaceId: string) => {
    const newSet = new Set(selectedSpaceIds);
    if (newSet.has(spaceId)) {
      newSet.delete(spaceId);
    } else {
      newSet.add(spaceId);
    }
    setSelectedSpaceIds(newSet);
  };

  const startExport = async () => {
    try {
      const response = await fetch('/api/export/confluence/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exportAll,
          spaceIds: exportAll ? [] : Array.from(selectedSpaceIds),
          outputDir,
          downloadAssets,
          maxCharsPerFile: maxCharsPerFile ? parseInt(maxCharsPerFile, 10) : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start export');
      }

      const data = await response.json();
      setJobId(data.jobId);
      setJobPolling(true);
      setCurrentStep(5);
    } catch (error) {
      console.error('Failed to start export:', error);
      alert(error instanceof Error ? error.message : 'Failed to start export');
    }
  };

  const fetchJobStatus = async (jid: string) => {
    try {
      const response = await fetch(`/api/export/confluence/status?jobId=${jid}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch job status');
      }

      const data: JobStatus = await response.json();
      setJobStatus(data);

      if (data.status === 'completed' || data.status === 'failed') {
        setJobPolling(false);
      }
    } catch (error) {
      console.error('Failed to fetch job status:', error);
      setJobPolling(false);
    }
  };

  // Filter spaces
  const filteredSpaces = previewData?.spaces.filter((space) => {
    // Filter by personal spaces toggle
    if (!showPersonalSpaces && space.type === 'personal') {
      return false;
    }
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        space.name.toLowerCase().includes(query) ||
        space.key.toLowerCase().includes(query)
      );
    }
    return true;
  }) || [];

  return (
    <div className="space-y-6">
      {/* Step 1: Configure */}
      {currentStep === 1 && (
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
                      ATLASSIAN_SITE
                    </span>
                    <span
                      className={`text-sm font-medium ${
                        hasSite
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-zinc-400 dark:text-zinc-600'
                      }`}
                    >
                      {hasSite ? '✓ Present' : '✗ Missing'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
                    <span className="font-mono text-sm text-zinc-600 dark:text-zinc-400">
                      ATLASSIAN_EMAIL
                    </span>
                    <span
                      className={`text-sm font-medium ${
                        hasEmail
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-zinc-400 dark:text-zinc-600'
                      }`}
                    >
                      {hasEmail ? '✓ Present' : '✗ Missing'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
                    <span className="font-mono text-sm text-zinc-600 dark:text-zinc-400">
                      ATLASSIAN_API_TOKEN
                    </span>
                    <span
                      className={`text-sm font-medium ${
                        hasApiToken
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-zinc-400 dark:text-zinc-600'
                      }`}
                    >
                      {hasApiToken ? '✓ Present' : '✗ Missing'}
                    </span>
                  </div>
                </div>
              </div>

              {siteUrl && (
                <div>
                  <h4 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Resolved Site URL
                  </h4>
                  <div className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
                    <code className="text-sm text-zinc-900 dark:text-zinc-100">
                      {siteUrl}
                    </code>
                  </div>
                </div>
              )}

              {!isConfigured && (
                <Alert variant="warning">
                  <p className="font-medium">Missing required configuration</p>
                  <p className="mt-1">Please set the following environment variables to continue:</p>
                  <ul className="mt-2 list-inside list-disc space-y-1 text-sm">
                    {!hasSite && (
                      <li>
                        <code className="font-mono">ATLASSIAN_SITE</code>
                      </li>
                    )}
                    {!hasEmail && (
                      <li>
                        <code className="font-mono">ATLASSIAN_EMAIL</code>
                      </li>
                    )}
                    {!hasApiToken && (
                      <li>
                        <code className="font-mono">ATLASSIAN_API_TOKEN</code>
                      </li>
                    )}
                  </ul>
                </Alert>
              )}

              {isConfigured && (
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
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 2: Select Scope</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {previewLoading && (
                <Alert variant="info">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                    <span>Loading spaces from Confluence...</span>
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
                  {/* Export all toggle */}
                  <div className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <label
                          htmlFor="export-all"
                          className="block font-medium text-zinc-900 dark:text-zinc-100"
                        >
                          Export all spaces
                        </label>
                        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                          {previewData.totals.spaceCount} spaces total
                        </p>
                      </div>
                      <input
                        id="export-all"
                        type="checkbox"
                        checked={exportAll}
                        onChange={(e) => setExportAll(e.target.checked)}
                        className="mt-1 h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Space selection */}
                  {!exportAll && (
                    <div>
                      <div className="mb-3 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            Select Spaces ({selectedSpaceIds.size} selected)
                          </h4>
                        </div>

                        {/* Show personal spaces toggle */}
                        <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                          <input
                            type="checkbox"
                            checked={showPersonalSpaces}
                            onChange={(e) => setShowPersonalSpaces(e.target.checked)}
                            className="rounded"
                          />
                          Show personal spaces
                        </label>

                        {/* Search input */}
                        <input
                          type="text"
                          placeholder="Search by name or key..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                        />
                      </div>

                      <div className="space-y-2">
                        {filteredSpaces.length === 0 && (
                          <div className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950">
                            {searchQuery
                              ? 'No spaces match your search'
                              : showPersonalSpaces
                                ? 'No spaces found'
                                : 'No spaces to display. Enable "Show personal spaces" to see more.'}
                          </div>
                        )}

                        {filteredSpaces.map((space) => (
                          <div
                            key={space.id}
                            className={`flex items-start gap-3 rounded-md border border-zinc-200 px-4 py-3 transition-colors ${
                              selectedSpaceIds.has(space.id)
                                ? 'bg-blue-50 dark:bg-blue-950/30'
                                : 'bg-white dark:bg-zinc-900'
                            } hover:bg-zinc-100 dark:hover:bg-zinc-800/50`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedSpaceIds.has(space.id)}
                              onChange={() => toggleSpace(space.id)}
                              className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                                  {space.name}
                                </span>
                                {space.type === 'personal' && (
                                  <span className="text-xs text-zinc-400 dark:text-zinc-600">
                                    👤
                                  </span>
                                )}
                              </div>
                              <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                                {space.key} • {space.type}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Total count */}
                  <div className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
                    <div className="text-sm text-zinc-600 dark:text-zinc-400">
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">
                        {exportAll
                          ? previewData.totals.spaceCount
                          : selectedSpaceIds.size}
                      </span>
                      {' '}
                      space{(exportAll ? previewData.totals.spaceCount : selectedSpaceIds.size) === 1 ? '' : 's'} selected
                    </div>
                  </div>

                  {/* Navigation */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => setCurrentStep(1)}
                      className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => setCurrentStep(3)}
                      disabled={!exportAll && selectedSpaceIds.size === 0}
                      className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Continue to Options
                    </button>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Options */}
      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 3: Export Options</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Output directory */}
              <div>
                <label htmlFor="output-dir" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Output Directory
                </label>
                <input
                  id="output-dir"
                  type="text"
                  value={outputDir}
                  onChange={(e) => setOutputDir(e.target.value)}
                  className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                />
                <p className="mt-1 text-xs text-zinc-500">
                  Pages will be exported to <code>{outputDir}/kb/&lt;spaceKey&gt;/</code>
                </p>
              </div>

              {/* Download assets */}
              <div className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <label
                      htmlFor="download-assets"
                      className="block font-medium text-zinc-900 dark:text-zinc-100"
                    >
                      Download assets (images, attachments)
                    </label>
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                      Coming soon - currently keeps remote links
                    </p>
                  </div>
                  <input
                    id="download-assets"
                    type="checkbox"
                    checked={downloadAssets}
                    onChange={(e) => setDownloadAssets(e.target.checked)}
                    disabled
                    className="mt-1 h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Max chars per file */}
              <div>
                <label htmlFor="max-chars" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Max Characters Per File (optional)
                </label>
                <input
                  id="max-chars"
                  type="number"
                  value={maxCharsPerFile}
                  onChange={(e) => setMaxCharsPerFile(e.target.value)}
                  placeholder="Leave empty for no limit"
                  className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                />
                <p className="mt-1 text-xs text-zinc-500">
                  Split large pages into multiple files for LLM context limits
                </p>
              </div>

              {/* Navigation */}
              <div className="flex gap-3">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
                >
                  Back
                </button>
                <button
                  onClick={() => setCurrentStep(4)}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Continue to Run Export
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Run Export */}
      {currentStep === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 4: Run Export</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Confirmation summary */}
              <div className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-4 dark:border-zinc-800 dark:bg-zinc-950">
                <h4 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Export Configuration
                </h4>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-500">Source</dt>
                    <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">
                      Confluence • {siteUrl || 'Unknown'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-500">Scope</dt>
                    <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">
                      {exportAll
                        ? `All spaces (${previewData?.totals.spaceCount || 0})`
                        : `${selectedSpaceIds.size} selected space${selectedSpaceIds.size === 1 ? '' : 's'}`}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-500">Options</dt>
                    <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">
                      Output: <code>{outputDir}</code> •
                      Assets: {downloadAssets ? 'Download' : 'Remote links'} •
                      Split: {maxCharsPerFile ? `${maxCharsPerFile} chars` : 'No limit'}
                    </dd>
                  </div>
                </dl>
              </div>

              <Alert variant="info">
                <p className="font-medium">Ready to export</p>
                <p className="mt-1 text-sm">
                  This will fetch pages from Confluence and write Markdown files to disk.
                </p>
              </Alert>

              {/* Navigation */}
              <div className="flex gap-3">
                <button
                  onClick={() => setCurrentStep(3)}
                  className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
                >
                  Back
                </button>
                <button
                  onClick={startExport}
                  className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                >
                  Start Export
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 5: Results */}
      {currentStep === 5 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 5: Export Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {jobPolling && !jobStatus && (
                <Alert variant="info">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                    <span>Starting export...</span>
                  </div>
                </Alert>
              )}

              {jobStatus?.status === 'running' && (
                <Alert variant="info">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                    <span>Export in progress...</span>
                  </div>
                </Alert>
              )}

              {jobStatus?.status === 'completed' && jobStatus.report && (
                <>
                  <Alert variant="success">
                    <p className="font-medium">Export completed successfully!</p>
                    <p className="mt-1 text-sm">
                      Processed {jobStatus.report.counts.pagesProcessed} pages in{' '}
                      {jobStatus.report.executionTime}s
                    </p>
                  </Alert>

                  <div className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-4 dark:border-zinc-800 dark:bg-zinc-950">
                    <h4 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      Summary
                    </h4>
                    <dl className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-zinc-600 dark:text-zinc-400">Output directory:</dt>
                        <dd className="font-mono text-zinc-900 dark:text-zinc-100">
                          {jobStatus.report.outputDir}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-zinc-600 dark:text-zinc-400">Pages processed:</dt>
                        <dd className="text-zinc-900 dark:text-zinc-100">
                          {jobStatus.report.counts.pagesProcessed}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-zinc-600 dark:text-zinc-400">Files created:</dt>
                        <dd className="text-zinc-900 dark:text-zinc-100">
                          {jobStatus.report.counts.filesCreated}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-zinc-600 dark:text-zinc-400">Files updated:</dt>
                        <dd className="text-zinc-900 dark:text-zinc-100">
                          {jobStatus.report.counts.filesUpdated}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-zinc-600 dark:text-zinc-400">Files skipped:</dt>
                        <dd className="text-zinc-900 dark:text-zinc-100">
                          {jobStatus.report.counts.filesSkipped}
                        </dd>
                      </div>
                      {jobStatus.report.counts.pagesFailed > 0 && (
                        <div className="flex justify-between">
                          <dt className="text-red-600 dark:text-red-400">Pages failed:</dt>
                          <dd className="text-red-900 dark:text-red-100">
                            {jobStatus.report.counts.pagesFailed}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>

                  {/* Logs */}
                  <details className="rounded-md border border-zinc-200 dark:border-zinc-800">
                    <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-900">
                      View export logs
                    </summary>
                    <div className="max-h-96 overflow-y-auto border-t border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
                      <pre className="text-xs text-zinc-600 dark:text-zinc-400">
                        {jobStatus.report.logs.join('\n')}
                      </pre>
                    </div>
                  </details>
                </>
              )}

              {jobStatus?.status === 'failed' && (
                <Alert variant="error">
                  <p className="font-medium">Export failed</p>
                  <p className="mt-1 text-sm">{jobStatus.error || 'Unknown error'}</p>
                </Alert>
              )}

              {/* Reset button */}
              {jobStatus && jobStatus.status !== 'running' && (
                <button
                  onClick={() => {
                    setCurrentStep(2);
                    setJobId(null);
                    setJobStatus(null);
                    setJobPolling(false);
                  }}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Run Another Export
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
