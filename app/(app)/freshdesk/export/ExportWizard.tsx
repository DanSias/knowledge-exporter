'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Tab } from '@headlessui/react';
import { Alert } from '@/app/components/Alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/Card';
import { CategoryDetailsModal } from '@/app/components/CategoryDetailsModal';
import { PreviewResult, CategoryPreview } from '@/lib/exporters/types';

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

  // State for category details modal
  const [selectedCategoryForModal, setSelectedCategoryForModal] = useState<CategoryPreview | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // State for navigation blocking
  const [navigationBlockMessage, setNavigationBlockMessage] = useState<string | null>(null);

  // State for options (Step 3)
  const [outputDir, setOutputDir] = useState('./exports');
  const [runName, setRunName] = useState('');
  const [downloadAssets, setDownloadAssets] = useState(false);
  const [maxCharsPerFile, setMaxCharsPerFile] = useState('');
  const [languageMode, setLanguageMode] = useState<'all' | 'en'>('all');

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
        runName: runName || undefined, // Auto-generate if empty
        downloadAssets,
        maxCharsPerFile: maxCharsPerFile ? parseInt(maxCharsPerFile, 10) : undefined,
        languageMode,
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

  const openCategoryModal = (category: CategoryPreview) => {
    setSelectedCategoryForModal(category);
    setIsModalOpen(true);
  };

  const closeCategoryModal = () => {
    setIsModalOpen(false);
    // Small delay before clearing to allow modal close animation
    setTimeout(() => setSelectedCategoryForModal(null), 200);
  };

  // Compute selection totals
  const selectionTotals = useMemo(() => {
    if (!previewData || exportAll) {
      return null;
    }

    const selectedCategories = previewData.categories.filter((c) =>
      selectedCategoryIds.has(c.id)
    );

    return {
      folders: selectedCategories.reduce((sum, c) => sum + c.folderCount, 0),
      articles: selectedCategories.reduce((sum, c) => sum + c.articleCount, 0),
      englishPublished: selectedCategories.reduce(
        (sum, c) => sum + c.englishPublishedArticleCount,
        0
      ),
    };
  }, [previewData, selectedCategoryIds, exportAll]);

  // Check if a step's prerequisites are met
  const isStep1Complete = isConfigured;
  const isStep2Complete = exportAll || selectedCategoryIds.size > 0;
  const isStep3Complete =
    outputDir.trim() !== '' &&
    (maxCharsPerFile === '' || parseInt(maxCharsPerFile, 10) > 0) &&
    (languageMode === 'all' || languageMode === 'en');
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

  const failedFiles = jobStatus?.report?.files.filter((f) => f.status === 'failed') || [];

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
                          FRESHDESK_API_KEY
                        </span>
                        <span
                          className={`text-sm font-medium ${
                            hasApiKey
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-zinc-400 dark:text-zinc-600'
                          }`}
                        >
                          {hasApiKey ? '✓ Present' : '✗ Missing'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
                        <span className="font-mono text-sm text-zinc-600 dark:text-zinc-400">
                          FRESHDESK_HOST or FRESHDESK_DOMAIN
                        </span>
                        <span
                          className={`text-sm font-medium ${
                            hasHost
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-zinc-400 dark:text-zinc-600'
                          }`}
                        >
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
                        {!hasApiKey && (
                          <li>
                            <code className="font-mono">FRESHDESK_API_KEY</code>
                          </li>
                        )}
                        {!hasHost && (
                          <li>
                            <code className="font-mono">FRESHDESK_HOST</code> or{' '}
                            <code className="font-mono">FRESHDESK_DOMAIN</code>
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
                      {/* Export all toggle with totals - Combined card */}
                      <div className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <label
                              htmlFor="export-all"
                              className="block font-medium text-zinc-900 dark:text-zinc-100"
                            >
                              Export all categories
                            </label>
                            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                              {previewData.totals.categoryCount} categories •{' '}
                              {previewData.totals.folderCount} folders •{' '}
                              {previewData.totals.articleCount} articles
                            </p>
                            {previewData.totals.englishPublishedArticleCount > 0 && (
                              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
                                English published: {previewData.totals.englishPublishedArticleCount}
                              </p>
                            )}
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

                      {/* Category selection */}
                      {!exportAll && (
                        <div>
                          <div className="mb-3 flex items-center justify-between">
                            <div>
                              <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                Select Categories ({selectedCategoryIds.size} selected)
                              </h4>
                              {selectionTotals && (
                                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                                  {selectionTotals.folders} folders • {selectionTotals.articles} articles
                                </p>
                              )}
                            </div>
                            <button
                              onClick={toggleSelectAll}
                              className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
                            >
                              {selectedCategoryIds.size === previewData.categories.length
                                ? 'Deselect All'
                                : 'Select All'}
                            </button>
                          </div>

                          <div className="space-y-2 max-h-96 overflow-y-auto">
                            <div className="grid grid-cols-[auto_1fr_auto] gap-4 rounded-md border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
                              <div></div>
                              <div>Category</div>
                              <div className="text-right">Content</div>
                            </div>

                            {previewData.categories.map((category) => (
                              <div
                                key={category.id}
                                className={`grid grid-cols-[auto_1fr_auto] gap-4 rounded-md border border-zinc-200 px-4 py-3 dark:border-zinc-800 transition-colors ${
                                  selectedCategoryIds.has(category.id)
                                    ? 'bg-blue-50 dark:bg-blue-950/30 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'
                                    : 'bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedCategoryIds.has(category.id)}
                                  onChange={() => toggleCategory(category.id)}
                                  className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                                />
                                <div>
                                  <button
                                    onClick={() => openCategoryModal(category)}
                                    className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 cursor-pointer text-left underline decoration-transparent hover:decoration-current transition-colors"
                                  >
                                    {category.name}
                                  </button>
                                </div>
                                <button
                                  onClick={() => openCategoryModal(category)}
                                  className="text-right text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 cursor-pointer underline decoration-transparent hover:decoration-current transition-colors"
                                >
                                  {category.folderCount} folders • {category.articleCount} articles
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <button
                        onClick={() => setCurrentStep(3)}
                        disabled={!exportAll && selectedCategoryIds.size === 0}
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
                      placeholder="freshdesk-2026-02-05-1530 (auto-generated if empty)"
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
                      Files will be saved to: {outputDir}/freshdesk/{runName || '<auto-generated>'}
                    </p>
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
                      className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
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
                      Split large articles into multiple files (e.g., 50000)
                    </p>
                  </div>

                  <div className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                      Language Filter
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="all"
                          checked={languageMode === 'all'}
                          onChange={(e) => setLanguageMode(e.target.value as 'all' | 'en')}
                          className="h-4 w-4 border-zinc-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-zinc-900 dark:text-zinc-100">All languages</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="en"
                          checked={languageMode === 'en'}
                          onChange={(e) => setLanguageMode(e.target.value as 'all' | 'en')}
                          className="h-4 w-4 border-zinc-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-zinc-900 dark:text-zinc-100">English only</span>
                      </label>
                    </div>
                    <p className="mt-2 text-xs text-zinc-500">
                      Export published articles in all languages or English only (recommended: All)
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
                              Freshdesk • {baseUrl || 'Unknown'}
                            </dd>
                          </div>

                          {/* Scope */}
                          <div>
                            <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-500">
                              Scope
                            </dt>
                            <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">
                              {exportAll
                                ? `All categories (${previewData?.totals.categoryCount || 0})`
                                : `${selectedCategoryIds.size} selected ${selectedCategoryIds.size === 1 ? 'category' : 'categories'}`}
                              {' • '}
                              {exportAll
                                ? `${previewData?.totals.folderCount || 0} folders`
                                : `${selectionTotals?.folders || 0} folders`}
                              {' • '}
                              {exportAll
                                ? `${previewData?.totals.articleCount || 0} articles`
                                : `${selectionTotals?.articles || 0} articles`}
                            </dd>
                          </div>

                          {/* Options */}
                          <div>
                            <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-500">
                              Options
                            </dt>
                            <dd className="mt-1 space-y-1 text-sm text-zinc-900 dark:text-zinc-100">
                              <div>
                                Language: {languageMode === 'all' ? 'All languages' : 'English only'}
                                {' • '}
                                Assets: {downloadAssets ? 'Yes' : 'No'}
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
                      <div className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
                        <div className="flex items-center gap-2">
                          <div
                            className={`h-3 w-3 rounded-full ${
                              jobStatus.status === 'running'
                                ? 'animate-pulse bg-blue-500'
                                : jobStatus.status === 'completed'
                                ? 'bg-green-500'
                                : jobStatus.status === 'failed'
                                ? 'bg-red-500'
                                : 'bg-zinc-400'
                            }`}
                          ></div>
                          <span className="font-medium text-zinc-900 dark:text-zinc-100">
                            Status: {jobStatus.status.charAt(0).toUpperCase() + jobStatus.status.slice(1)}
                          </span>
                        </div>
                      </div>

                      {jobStatus.status === 'running' && (
                        <div>
                          <h4 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            Progress
                          </h4>
                          <div className="space-y-2 rounded-md border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
                            <div className="flex justify-between text-sm">
                              <span className="text-zinc-600 dark:text-zinc-400">Categories</span>
                              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                                {jobStatus.progress.categoriesProcessed}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-zinc-600 dark:text-zinc-400">Folders</span>
                              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                                {jobStatus.progress.foldersProcessed}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-zinc-600 dark:text-zinc-400">Articles</span>
                              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                                {jobStatus.progress.articlesProcessed}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {jobStatus.logs.length > 0 && (
                        <div>
                          <h4 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            Recent Logs
                          </h4>
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
          </Tab.Panel>

          {/* Step 5: Results */}
          <Tab.Panel>
            <Card>
              <CardHeader>
                <CardTitle>Step 5: Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {jobStatus?.report && (
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
                              {jobStatus.report.counts.filesFailed}
                            </div>
                            <div className="text-sm text-zinc-600 dark:text-zinc-400">Failed</div>
                          </div>
                        </div>
                      </div>

                      {failedFiles.length > 0 && (
                        <div>
                          <h4 className="mb-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            Failed Files
                          </h4>
                          <div className="space-y-2">
                            {failedFiles.map((file, i) => (
                              <div
                                key={i}
                                className="rounded-md border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900 dark:bg-red-950"
                              >
                                <div className="font-medium text-red-900 dark:text-red-100">
                                  {file.articleTitle || 'Unknown'}
                                </div>
                                <div className="mt-1 text-sm text-red-700 dark:text-red-300">
                                  {file.error}
                                </div>
                                <div className="mt-1 font-mono text-xs text-red-600 dark:text-red-400">
                                  {file.path}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

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

                      <Alert variant="info">
                        <p className="text-sm">
                          <strong>Files generated:</strong> report.json (machine-readable) and SUMMARY.md
                          (human-readable) in the output directory
                        </p>
                      </Alert>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>

      {/* Modal */}
      <CategoryDetailsModal
        category={selectedCategoryForModal}
        isOpen={isModalOpen}
        onClose={closeCategoryModal}
      />
    </div>
  );
}
