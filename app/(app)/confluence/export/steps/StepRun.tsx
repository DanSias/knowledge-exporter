import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/Card';
import { ProgressBanner } from '@/app/components/export/ProgressBanner';
import { StatsCards } from '@/app/components/export/StatsCards';
import { ExportEstimate, type ExportEstimateData } from '@/app/components/export/ExportEstimate';
import { JobStatus } from '@/hooks/useExportJob';

interface PreviewResult {
  site: string;
  spaces: any[];
  totals: {
    spaceCount: number;
  };
}

interface StepRunProps {
  jobStatus: JobStatus | null;
  siteUrl: string | null;
  exportAll: boolean;
  selectedSpaceKeys: string[];
  previewData: PreviewResult | null;
  downloadAssets: boolean;
  maxCharsPerFile: string;
  outputDir: string;
  runName: string;
  onStartExport: () => void;
}

export function StepRun({
  jobStatus,
  siteUrl,
  exportAll,
  selectedSpaceKeys,
  previewData,
  downloadAssets,
  maxCharsPerFile,
  outputDir,
  runName,
  onStartExport,
}: StepRunProps) {
  const [estimate, setEstimate] = useState<ExportEstimateData | null>(null);
  const [estimateLoading, setEstimateLoading] = useState(false);
  const [estimateError, setEstimateError] = useState<string | null>(null);

  // Deterministic selection readiness check
  const selectionReady = exportAll || (selectedSpaceKeys !== undefined && selectedSpaceKeys.length > 0);
  const hasValidSelection = exportAll || selectedSpaceKeys.length > 0;

  // DEBUG LOGGING (dev-only)
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[StepRun] Debug - Selection state:', {
        exportAll,
        selectedSpaceKeys,
        selectionReady,
        hasValidSelection,
      });
    }
  }, [exportAll, selectedSpaceKeys, selectionReady, hasValidSelection]);

  // Fetch estimate when scope or options change
  useEffect(() => {
    if (jobStatus) return; // Don't fetch if job is running

    // Only fetch if selection is ready
    if (!selectionReady) {
      setEstimateLoading(true);
      setEstimate(null);
      setEstimateError(null);
      return;
    }

    async function fetchEstimate() {
      setEstimateLoading(true);
      setEstimateError(null);

      try {
        const scope = {
          exportAll,
          spaceKeys: exportAll ? [] : selectedSpaceKeys,
        };

        const options = {
          outputDir,
          runName: runName || undefined,
          downloadAssets,
          maxCharsPerFile: maxCharsPerFile ? parseInt(maxCharsPerFile, 10) : undefined,
        };

        const payload = { scope, options };

        // DEBUG LOGGING (dev-only)
        if (process.env.NODE_ENV !== 'production') {
          console.log('[StepRun] Debug - Sending estimate request:', payload);
        }

        const response = await fetch('/api/export/confluence/estimate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch estimate');
        }

        const data = await response.json();

        // DEBUG LOGGING (dev-only)
        if (process.env.NODE_ENV !== 'production') {
          console.log('[StepRun] Debug - Estimate response:', data);
        }

        setEstimate(data);
      } catch (err) {
        setEstimateError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setEstimateLoading(false);
      }
    }

    fetchEstimate();
  }, [
    exportAll,
    selectedSpaceKeys,
    downloadAssets,
    maxCharsPerFile,
    outputDir,
    runName,
    jobStatus,
    selectionReady,
  ]);

  // Handle "Go back to Scope" if selection is not ready after hydration
  const showSelectionError = !selectionReady && previewData !== null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Step 4: Run Export</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {!jobStatus && (
            <>
              {/* Selection not ready error */}
              {showSelectionError && (
                <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900 dark:bg-red-950">
                  <p className="font-medium text-red-900 dark:text-red-100">Selection not ready</p>
                  <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                    Please go back to the Scope step and select at least one space, or enable "Export all spaces".
                  </p>
                </div>
              )}

              {/* Confirmation Summary */}
              {!showSelectionError && (
                <div className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-4 dark:border-zinc-800 dark:bg-zinc-950">
                  <h4 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    Export Configuration
                  </h4>
                  <dl className="space-y-3">
                    {/* Source */}
                    <div>
                      <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-500">Source</dt>
                      <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">
                        Confluence • {siteUrl || 'Unknown'}
                      </dd>
                    </div>

                    {/* Scope */}
                    <div>
                      <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-500">Scope</dt>
                      <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">
                        {exportAll
                          ? `All spaces (${previewData?.totals.spaceCount || 0})`
                          : `${selectedSpaceKeys.length} selected ${
                              selectedSpaceKeys.length === 1 ? 'space' : 'spaces'
                            }`}
                      </dd>
                    </div>

                    {/* Options */}
                    <div>
                      <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-500">Options</dt>
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
              )}

              {/* Export Estimate */}
              {!showSelectionError && (
                <ExportEstimate
                  estimate={estimate}
                  loading={estimateLoading}
                  error={estimateError}
                />
              )}

              {/* Start Export Button */}
              <button
                onClick={onStartExport}
                disabled={!hasValidSelection}
                className="rounded-md bg-green-600 px-6 py-3 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Start Export
              </button>
              {!hasValidSelection && (
                <p className="mt-2 text-sm text-zinc-500">
                  Please select at least one space or enable "Export all spaces" to continue.
                </p>
              )}
            </>
          )}

          {jobStatus && (
            <>
              {/* Status banner */}
              {jobStatus.status === 'running' && (
                <ProgressBanner
                  message="Export in progress..."
                  phase={jobStatus.phase}
                />
              )}

              {/* Live progress stats during running */}
              {jobStatus.status === 'running' && jobStatus.progress && (
                <div>
                  <h4 className="mb-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Live Progress
                  </h4>
                  <StatsCards
                    filesCreated={jobStatus.progress.filesCreated || 0}
                    filesUpdated={jobStatus.progress.filesUpdated || 0}
                    filesSkipped={jobStatus.progress.filesSkipped || 0}
                    pagesFailed={jobStatus.progress.pagesFailed}
                  />
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
                <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900 dark:bg-red-950">
                  <p className="font-medium text-red-900 dark:text-red-100">Export failed</p>
                  <p className="mt-1 text-sm text-red-700 dark:text-red-300">{jobStatus.error}</p>
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
