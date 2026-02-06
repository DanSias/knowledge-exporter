'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Tab } from '@headlessui/react';
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
  phase?: string;
  progress?: {
    pagesProcessed: number;
    pagesFailed: number;
    filesCreated: number;
    filesUpdated: number;
    filesSkipped: number;
  };
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

  // State for step progression
  const [currentStep, setCurrentStep] = useState<number>(isConfigured ? 2 : 1);

  // State for preview data
  const [previewData, setPreviewData] = useState<PreviewResult | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // State for scope selection (Step 2)
  const [exportAll, setExportAll] = useState(true);
  const [selectedSpaceIds, setSelectedSpaceIds] = useState<Set<string>>(new Set());
  const [showPersonalSpaces, setShowPersonalSpaces] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // State for navigation blocking
  const [navigationBlockMessage, setNavigationBlockMessage] = useState<string | null>(null);

  // State for options (Step 3)
  const [outputDir, setOutputDir] = useState('./exports');
  const [runName, setRunName] = useState('');
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
      }, 750); // Poll every 750ms for live updates
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

  const startExport = async () => {
    try {
      const scope = {
        exportAll,
        spaceIds: exportAll ? [] : Array.from(selectedSpaceIds),
      };

      const options = {
        outputDir,
        runName: runName || undefined, // Auto-generate if empty
        downloadAssets,
        maxCharsPerFile: maxCharsPerFile ? parseInt(maxCharsPerFile, 10) : undefined,
      };

      const response = await fetch('/api/export/confluence/run', {
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

      fetchJobStatus(data.jobId);
    } catch (error) {
      console.error('Failed to start export:', error);
      alert('Failed to start export: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const fetchJobStatus = async (id: string) => {
    try {
      const response = await fetch(`/api/export/confluence/status?jobId=${id}`);

      if (!response.ok) {
        throw new Error('Failed to fetch job status');
      }

      const data: JobStatus = await response.json();
      setJobStatus(data);

      if ((data.status === 'completed' || data.status === 'failed') && currentStep === 4) {
        setCurrentStep(5);
      }
    } catch (error) {
      console.error('Failed to fetch job status:', error);
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

  const toggleSelectAll = () => {
    if (!filteredSpaces) return;

    if (selectedSpaceIds.size === filteredSpaces.length) {
      setSelectedSpaceIds(new Set());
    } else {
      setSelectedSpaceIds(new Set(filteredSpaces.map((s) => s.id)));
    }
  };

  // Filter spaces based on personal spaces toggle and search query
  const filteredSpaces = useMemo(() => {
    return previewData?.spaces.filter((space) => {
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
  }, [previewData, showPersonalSpaces, searchQuery]);

  // Check if a step's prerequisites are met
  const isStep1Complete = isConfigured;
  const isStep2Complete = exportAll || selectedSpaceIds.size > 0;
  const isStep3Complete =
    outputDir.trim() !== '' &&
    (maxCharsPerFile === '' || parseInt(maxCharsPerFile, 10) > 0);
  const isStep4Complete = jobStatus?.status === 'completed' || jobStatus?.status === 'failed';

  // Determine which steps are unlocked
  const canAccessStep2 = isStep1Complete;
  const canAccessStep3 = isStep1Complete && isStep2Complete;
  const canAccessStep4 = isStep1Complete && isStep2Complete && isStep3Complete;
  const canAccessStep5 = isStep1Complete && isStep2Complete && isStep3Complete && isStep4Complete;

  // Handle tab navigation with gating
  const handleTabChange = (newIndex: number) => {
    const newStep = newIndex + 1;

    // Clear any previous block message
    setNavigationBlockMessage(null);

    // Always allow going backwards
    if (newStep < currentStep) {
      setCurrentStep(newStep);
      return;
    }

    // Check if forward navigation is allowed
    if (newStep === 2 && !canAccessStep2) {
      setNavigationBlockMessage('Complete Step 1: Configure to continue');
      return;
    }
    if (newStep === 3 && !canAccessStep3) {
      setNavigationBlockMessage('Complete Step 2: Select Scope to continue');
      return;
    }
    if (newStep === 4 && !canAccessStep4) {
      setNavigationBlockMessage('Complete Step 3: Options to continue');
      return;
    }
    if (newStep === 5 && !canAccessStep5) {
      setNavigationBlockMessage('Complete Step 4: Run Export to continue');
      return;
    }

    // Navigation allowed
    setCurrentStep(newStep);
  };

  // Tab steps definition
  const tabSteps = [
    { number: 1, title: 'Configure', unlocked: true },
    { number: 2, title: 'Scope', unlocked: canAccessStep2 },
    { number: 3, title: 'Options', unlocked: canAccessStep3 },
    { number: 4, title: 'Run', unlocked: canAccessStep4 },
    { number: 5, title: 'Results', unlocked: canAccessStep5 },
  ];

  return (
    <div className="space-y-6">
      {/* Navigation Block Message */}
      {navigationBlockMessage && (
        <Alert variant="warning">
          <p className="text-sm">{navigationBlockMessage}</p>
        </Alert>
      )}

      {/* Tabs Navigation */}
      <Tab.Group selectedIndex={currentStep - 1} onChange={handleTabChange}>
        <Tab.List className="flex items-center gap-2">
          {tabSteps.map((step, idx) => (
            <Tab key={step.number} className="flex items-center gap-2 focus:outline-none">
              {({ selected }) => (
                <>
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors ${
                        selected
                          ? 'border-blue-500 bg-blue-500 text-white'
                          : currentStep > step.number
                          ? 'border-green-500 bg-green-500 text-white'
                          : step.unlocked
                          ? 'border-zinc-300 bg-white text-zinc-600 hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-600'
                          : 'border-zinc-200 bg-zinc-100 text-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-600'
                      }`}
                    >
                      {step.number}
                    </div>
                    <span
                      className={`text-sm font-medium ${
                        selected
                          ? 'text-blue-600 dark:text-blue-400'
                          : currentStep > step.number
                          ? 'text-green-600 dark:text-green-400'
                          : step.unlocked
                          ? 'text-zinc-600 dark:text-zinc-400'
                          : 'text-zinc-400 dark:text-zinc-600'
                      }`}
                    >
                      {step.title}
                    </span>
                  </div>
                  {idx < tabSteps.length - 1 && (
                    <div className="h-0.5 w-8 bg-zinc-200 dark:bg-zinc-800"></div>
                  )}
                </>
              )}
            </Tab>
          ))}
        </Tab.List>

        <Tab.Panels className="mt-6">
          {/* Step 1: Configure */}
          <Tab.Panel>
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
                        <code className="text-sm text-zinc-900 dark:text-zinc-100">{siteUrl}</code>
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
          </Tab.Panel>

          {/* Step 2: Select Scope */}
          <Tab.Panel>
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
                      {/* Export all toggle with totals */}
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
                              Total: {previewData.totals.spaceCount} spaces
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
                          <div className="mb-3 flex items-center justify-between">
                            <div>
                              <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                Select Spaces ({selectedSpaceIds.size} of {previewData.totals.spaceCount} selected)
                              </h4>
                              {filteredSpaces.length !== previewData.totals.spaceCount && (
                                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                                  Showing {filteredSpaces.length} filtered spaces
                                </p>
                              )}
                            </div>
                            <button
                              onClick={toggleSelectAll}
                              className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
                            >
                              {selectedSpaceIds.size === filteredSpaces.length
                                ? 'Deselect All'
                                : 'Select All'}
                            </button>
                          </div>

                          {/* Show personal spaces toggle */}
                          <div className="mb-3 flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="show-personal"
                              checked={showPersonalSpaces}
                              onChange={(e) => setShowPersonalSpaces(e.target.checked)}
                              className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                            />
                            <label
                              htmlFor="show-personal"
                              className="text-sm text-zinc-600 dark:text-zinc-400"
                            >
                              Show personal spaces
                            </label>
                          </div>

                          {/* Search input */}
                          <input
                            type="text"
                            placeholder="Search by name or key..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="mb-3 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                          />

                          <div className="space-y-2 max-h-96 overflow-y-auto">
                            <div className="grid grid-cols-[auto_1fr_auto] gap-4 rounded-md border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
                              <div></div>
                              <div>Space</div>
                              <div className="text-right">Type</div>
                            </div>

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
                                className={`grid grid-cols-[auto_1fr_auto] gap-4 rounded-md border border-zinc-200 px-4 py-3 dark:border-zinc-800 transition-colors ${
                                  selectedSpaceIds.has(space.id)
                                    ? 'bg-blue-50 dark:bg-blue-950/30 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'
                                    : 'bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedSpaceIds.has(space.id)}
                                  onChange={() => toggleSpace(space.id)}
                                  className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                                />
                                <div>
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
                                    {space.key}
                                  </div>
                                </div>
                                <div className="text-right text-sm text-zinc-600 dark:text-zinc-400">
                                  {space.type}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <button
                        onClick={() => setCurrentStep(3)}
                        disabled={!exportAll && selectedSpaceIds.size === 0}
                        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Continue to Options
                      </button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </Tab.Panel>

          {/* Step 3: Options */}
          <Tab.Panel>
            <Card>
              <CardHeader>
                <CardTitle>Step 3: Options</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="runName"
                      className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                    >
                      Run Name (optional)
                    </label>
                    <input
                      id="runName"
                      type="text"
                      value={runName}
                      onChange={(e) => setRunName(e.target.value)}
                      className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                      placeholder="confluence-2026-02-05-1530 (auto-generated if empty)"
                    />
                    <p className="mt-1 text-xs text-zinc-500">
                      Custom name for this export run. If empty, auto-generated with timestamp.
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="outputDir"
                      className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                    >
                      Base Output Directory
                    </label>
                    <input
                      id="outputDir"
                      type="text"
                      value={outputDir}
                      onChange={(e) => setOutputDir(e.target.value)}
                      className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                      placeholder="./exports"
                    />
                    <p className="mt-1 text-xs text-zinc-500">
                      Files will be saved to: {outputDir}/confluence/{runName || '<auto-generated>'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
                    <div>
                      <label htmlFor="downloadAssets" className="font-medium text-zinc-900 dark:text-zinc-100">
                        Download assets
                      </label>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Download images and attachments locally (not yet implemented)
                      </p>
                    </div>
                    <input
                      id="downloadAssets"
                      type="checkbox"
                      checked={downloadAssets}
                      onChange={(e) => setDownloadAssets(e.target.checked)}
                      disabled
                      className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="maxCharsPerFile"
                      className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                    >
                      Max Characters Per File (optional)
                    </label>
                    <input
                      id="maxCharsPerFile"
                      type="number"
                      value={maxCharsPerFile}
                      onChange={(e) => setMaxCharsPerFile(e.target.value)}
                      className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                      placeholder="Leave empty for unlimited"
                    />
                    <p className="mt-1 text-xs text-zinc-500">
                      Split large pages into multiple files (e.g., 50000)
                    </p>
                  </div>

                  <button
                    onClick={() => setCurrentStep(4)}
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    Continue to Run Export
                  </button>
                </div>
              </CardContent>
            </Card>
          </Tab.Panel>

          {/* Step 4: Run */}
          <Tab.Panel>
            <Card>
              <CardHeader>
                <CardTitle>Step 4: Run Export</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {!jobId && (
                    <>
                      {/* Confirmation Summary */}
                      <div className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-4 dark:border-zinc-800 dark:bg-zinc-950">
                        <h4 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                          Export Configuration
                        </h4>
                        <dl className="space-y-3">
                          {/* Source */}
                          <div>
                            <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-500">
                              Source
                            </dt>
                            <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">
                              Confluence • {siteUrl || 'Unknown'}
                            </dd>
                          </div>

                          {/* Scope */}
                          <div>
                            <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-500">
                              Scope
                            </dt>
                            <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">
                              {exportAll
                                ? `All spaces (${previewData?.totals.spaceCount || 0})`
                                : `${selectedSpaceIds.size} selected ${selectedSpaceIds.size === 1 ? 'space' : 'spaces'}`}
                            </dd>
                          </div>

                          {/* Options */}
                          <div>
                            <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-500">
                              Options
                            </dt>
                            <dd className="mt-1 space-y-1 text-sm text-zinc-900 dark:text-zinc-100">
                              <div>
                                Assets: {downloadAssets ? 'Download' : 'Remote links'}
                                {' • '}
                                Split: {maxCharsPerFile ? `${maxCharsPerFile} chars` : 'Unlimited'}
                              </div>
                              <div className="text-xs text-zinc-600 dark:text-zinc-400">
                                Output: {outputDir}
                              </div>
                            </dd>
                          </div>
                        </dl>
                      </div>

                      <button
                        onClick={startExport}
                        className="rounded-md bg-green-600 px-6 py-3 text-sm font-medium text-white hover:bg-green-700"
                      >
                        Start Export
                      </button>
                    </>
                  )}

                  {jobStatus && (
                    <>
                      {/* Status banner */}
                      {jobStatus.status === 'running' && (
                        <Alert variant="info">
                          <div className="flex items-center gap-2">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                            <div>
                              <p className="font-medium">Export in progress...</p>
                              {jobStatus.phase && (
                                <p className="mt-1 text-sm">{jobStatus.phase}</p>
                              )}
                            </div>
                          </div>
                        </Alert>
                      )}

                      {/* Live progress stats during running */}
                      {jobStatus.status === 'running' && jobStatus.progress && (
                        <div>
                          <h4 className="mb-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            Live Progress
                          </h4>
                          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                            <div className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
                              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                {jobStatus.progress.filesCreated}
                              </div>
                              <div className="text-sm text-zinc-600 dark:text-zinc-400">Created</div>
                            </div>
                            <div className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
                              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                {jobStatus.progress.filesUpdated}
                              </div>
                              <div className="text-sm text-zinc-600 dark:text-zinc-400">Updated</div>
                            </div>
                            <div className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
                              <div className="text-2xl font-bold text-zinc-600 dark:text-zinc-400">
                                {jobStatus.progress.filesSkipped}
                              </div>
                              <div className="text-sm text-zinc-600 dark:text-zinc-400">Skipped</div>
                            </div>
                            <div className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
                              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                                {jobStatus.progress.pagesFailed}
                              </div>
                              <div className="text-sm text-zinc-600 dark:text-zinc-400">Failed</div>
                            </div>
                          </div>
                          <div className="mt-4 rounded-md border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
                            <div className="flex justify-between text-sm">
                              <span className="text-zinc-600 dark:text-zinc-400">Pages processed</span>
                              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                                {jobStatus.progress.pagesProcessed}
                              </span>
                            </div>
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
          </Tab.Panel>

          {/* Step 5: Results */}
          <Tab.Panel>
            <Card>
              <CardHeader>
                <CardTitle>Step 5: Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Show running state with live progress */}
                  {jobStatus?.status === 'running' && (
                    <>
                      <Alert variant="info">
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                          <div>
                            <p className="font-medium">Export in progress...</p>
                            {jobStatus.phase && (
                              <p className="mt-1 text-sm">{jobStatus.phase}</p>
                            )}
                          </div>
                        </div>
                      </Alert>

                      {jobStatus.progress && (
                        <div>
                          <h4 className="mb-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            Live Progress
                          </h4>
                          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                            <div className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
                              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                {jobStatus.progress.filesCreated}
                              </div>
                              <div className="text-sm text-zinc-600 dark:text-zinc-400">Created</div>
                            </div>
                            <div className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
                              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                {jobStatus.progress.filesUpdated}
                              </div>
                              <div className="text-sm text-zinc-600 dark:text-zinc-400">Updated</div>
                            </div>
                            <div className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
                              <div className="text-2xl font-bold text-zinc-600 dark:text-zinc-400">
                                {jobStatus.progress.filesSkipped}
                              </div>
                              <div className="text-sm text-zinc-600 dark:text-zinc-400">Skipped</div>
                            </div>
                            <div className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
                              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                                {jobStatus.progress.pagesFailed}
                              </div>
                              <div className="text-sm text-zinc-600 dark:text-zinc-400">Failed</div>
                            </div>
                          </div>
                          <div className="mt-4 rounded-md border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
                            <div className="flex justify-between text-sm">
                              <span className="text-zinc-600 dark:text-zinc-400">Pages processed</span>
                              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                                {jobStatus.progress.pagesProcessed}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Show completed/failed state with final stats */}
                  {jobStatus?.report && jobStatus.status !== 'running' && (
                    <>
                      <Alert variant={jobStatus.status === 'completed' ? 'success' : 'error'}>
                        <p className="font-medium">
                          {jobStatus.status === 'completed'
                            ? 'Export completed successfully'
                            : 'Export completed with errors'}
                        </p>
                      </Alert>

                      <div>
                        <h4 className="mb-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                          Statistics
                        </h4>
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
                              {jobStatus.report.counts.pagesFailed}
                            </div>
                            <div className="text-sm text-zinc-600 dark:text-zinc-400">Failed</div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                          Output Directory
                        </h4>
                        <div className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
                          <code className="text-sm text-zinc-900 dark:text-zinc-100">
                            {jobStatus.report.outputDir}
                          </code>
                        </div>
                        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                          Open this folder in your file manager to view exported files
                        </p>
                      </div>

                      {/* Logs */}
                      {jobStatus.report.logs.length > 0 && (
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
                      )}
                    </>
                  )}

                  {jobStatus && jobStatus.status !== 'running' && (
                    <button
                      onClick={() => {
                        setCurrentStep(2);
                        setJobId(null);
                        setJobStatus(null);
                      }}
                      className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    >
                      Run Another Export
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
}
