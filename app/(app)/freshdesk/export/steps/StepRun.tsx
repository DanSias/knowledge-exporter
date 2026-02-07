import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/Card';
import { Alert } from '@/app/components/Alert';
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
  onStartExport,
}: StepRunProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Step 4: Run Export</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {!jobStatus && (
            <>
              {/* Confirmation Summary */}
              <div className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-4 dark:border-zinc-800 dark:bg-zinc-950">
                <h4 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Export Configuration
                </h4>
                <dl className="space-y-3">
                  {/* Source */}
                  <div>
                    <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-500">Source</dt>
                    <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">
                      Freshdesk • {baseUrl || 'Unknown'}
                    </dd>
                  </div>

                  {/* Scope */}
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

                  {/* Options */}
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

              <button
                onClick={onStartExport}
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

              {jobStatus.status === 'running' && jobStatus.progress && (
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

              {jobStatus.logs && jobStatus.logs.length > 0 && (
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
  );
}
