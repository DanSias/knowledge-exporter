import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/Card';
import { Alert } from '@/app/components/Alert';
import { ExportEstimate, type ExportEstimateData } from '@/app/components/export/ExportEstimate';
import { ProgressBanner } from '@/app/components/export/ProgressBanner';
import { StatsCards } from '@/app/components/export/StatsCards';
import { JobStatus } from '@/hooks/useExportJob';
import { PreviewResult } from '@/lib/exporters/types';

interface StepRunProps {
  jobStatus: JobStatus | null;
  baseUrl: string | null;
  exportAll: boolean;
  selectedCategoryIds: Set<number>;
  previewData: PreviewResult | null;
  selectionTotals: {
    folders: number;
    articles: number;
    englishPublished: number;
  } | null;
  languageMode: 'all' | 'en';
  downloadAssets: boolean;
  maxCharsPerFile: string;
  outputDir: string;
  runName: string;
  onStartExport: () => void;
}

export function StepRun({
  jobStatus,
  baseUrl,
  exportAll,
  selectedCategoryIds,
  previewData,
  selectionTotals,
  languageMode,
  downloadAssets,
  maxCharsPerFile,
  outputDir,
  runName,
  onStartExport,
}: StepRunProps) {
  const [estimate, setEstimate] = useState<ExportEstimateData | null>(null);
  const [estimateLoading, setEstimateLoading] = useState(false);
  const [estimateError, setEstimateError] = useState<string | null>(null);

  // Fetch estimate when scope or options change
  useEffect(() => {
    if (jobStatus) return; // Don't fetch if job is running

    async function fetchEstimate() {
      setEstimateLoading(true);
      setEstimateError(null);

      try {
        const scope = {
          exportAll,
          categoryIds: exportAll ? [] : Array.from(selectedCategoryIds),
        };

        const options = {
          outputDir,
          runName: runName || undefined,
          downloadAssets,
          maxCharsPerFile: maxCharsPerFile ? parseInt(maxCharsPerFile, 10) : undefined,
          languageMode,
        };

        const response = await fetch('/api/export/freshdesk/estimate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scope, options }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch estimate');
        }

        const data = await response.json();
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
    selectedCategoryIds,
    languageMode,
    downloadAssets,
    maxCharsPerFile,
    outputDir,
    runName,
    jobStatus,
  ]);

  const isRunning = jobStatus?.status === 'running';
  const isFailed = jobStatus?.status === 'failed';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Step 4: Run Export</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Pre-run: Configuration summary + estimate + start button */}
          {!jobStatus && (
            <>
              {/* Confirmation Summary */}
              <div className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-4 dark:border-zinc-800 dark:bg-zinc-950">
                <h4 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Export Configuration
                </h4>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-500">Source</dt>
                    <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">
                      Freshdesk • {baseUrl || 'Unknown'}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-500">Scope</dt>
                    <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">
                      {exportAll
                        ? `All categories (${previewData?.totals.categoryCount || 0})`
                        : `${selectedCategoryIds.size} selected ${
                            selectedCategoryIds.size === 1 ? 'category' : 'categories'
                          }`}
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

                  <div>
                    <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-500">Options</dt>
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

              <ExportEstimate
                estimate={estimate}
                loading={estimateLoading}
                error={estimateError}
              />

              <button
                onClick={onStartExport}
                className="rounded-md bg-green-600 px-6 py-3 text-sm font-medium text-white hover:bg-green-700"
              >
                Start Export
              </button>
            </>
          )}

          {/* Running state: live progress */}
          {jobStatus && (
            <>
              {isRunning && (
                <ProgressBanner message="Export in progress..." />
              )}

              {isRunning && jobStatus.progress && (
                <div>
                  <h4 className="mb-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Live Progress
                  </h4>
                  <StatsCards
                    filesCreated={jobStatus.progress.filesCreated || 0}
                    filesUpdated={jobStatus.progress.filesUpdated || 0}
                    filesSkipped={jobStatus.progress.filesSkipped || 0}
                    filesFailed={jobStatus.progress.filesFailed}
                  />
                  <div className="mt-4 space-y-2 rounded-md border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-600 dark:text-zinc-400">Articles processed</span>
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">
                        {jobStatus.progress.articlesProcessed}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-600 dark:text-zinc-400">Folders</span>
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">
                        {jobStatus.progress.foldersProcessed}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-600 dark:text-zinc-400">Categories</span>
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">
                        {jobStatus.progress.categoriesProcessed}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {isFailed && (
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
  );
}
