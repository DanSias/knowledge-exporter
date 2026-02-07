import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/Card';
import { Alert } from '@/app/components/Alert';
import { StatsCards } from '@/app/components/export/StatsCards';
import { ProgressBanner } from '@/app/components/export/ProgressBanner';
import { JobStatus } from '@/hooks/useExportJob';

interface StepResultsProps {
  jobStatus: JobStatus | null;
  onRunAnother: () => void;
}

export function StepResults({ jobStatus, onRunAnother }: StepResultsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Step 5: Results</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Show running state with live progress */}
          {jobStatus?.status === 'running' && (
            <>
              <ProgressBanner
                message="Export in progress..."
                phase={jobStatus.phase}
              />

              {jobStatus.progress && (
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
                <StatsCards
                  filesCreated={jobStatus.report.counts.filesCreated}
                  filesUpdated={jobStatus.report.counts.filesUpdated}
                  filesSkipped={jobStatus.report.counts.filesSkipped}
                  pagesFailed={jobStatus.report.counts.pagesFailed}
                />
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
              {jobStatus.report.logs && jobStatus.report.logs.length > 0 && (
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
              onClick={onRunAnother}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Run Another Export
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
