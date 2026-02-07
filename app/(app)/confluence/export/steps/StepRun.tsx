import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/Card';
import { ProgressBanner } from '@/app/components/export/ProgressBanner';
import { StatsCards } from '@/app/components/export/StatsCards';
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
  selectedSpaceIds: Set<string>;
  previewData: PreviewResult | null;
  downloadAssets: boolean;
  maxCharsPerFile: string;
  outputDir: string;
  onStartExport: () => void;
}

export function StepRun({
  jobStatus,
  siteUrl,
  exportAll,
  selectedSpaceIds,
  previewData,
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
                      Confluence • {siteUrl || 'Unknown'}
                    </dd>
                  </div>

                  {/* Scope */}
                  <div>
                    <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-500">Scope</dt>
                    <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">
                      {exportAll
                        ? `All spaces (${previewData?.totals.spaceCount || 0})`
                        : `${selectedSpaceIds.size} selected ${
                            selectedSpaceIds.size === 1 ? 'space' : 'spaces'
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
