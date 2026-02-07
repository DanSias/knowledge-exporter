import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/Card';
import { Alert } from '@/app/components/Alert';
import { StatsCards } from '@/app/components/export/StatsCards';
import { ChangedFilesModal, type FileEntry } from '@/app/components/export/ChangedFilesModal';
import { JobStatus } from '@/hooks/useExportJob';

interface StepResultsProps {
  jobStatus: JobStatus | null;
}

export function StepResults({ jobStatus }: StepResultsProps) {
  const [showChangedFilesModal, setShowChangedFilesModal] = useState(false);

  const failedFiles =
    jobStatus?.report?.files?.filter((f) => f.status === 'failed') || [];

  // Transform report files to modal format
  const modalFiles: FileEntry[] =
    jobStatus?.report?.files?.map((f) => ({
      pathRelative: f.pathRelative || f.path,
      pathAbsolute: f.pathAbsolute || f.path,
      status: f.status as 'created' | 'updated' | 'skipped' | 'failed',
      bytes: f.bytes || 0,
      hash: f.hash || null,
      error: f.error || null,
    })) || [];

  return (
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
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Statistics
                  </h4>
                  <button
                    onClick={() => setShowChangedFilesModal(true)}
                    className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    View changed files →
                  </button>
                </div>
                <StatsCards
                  filesCreated={jobStatus.report.counts.filesCreated}
                  filesUpdated={jobStatus.report.counts.filesUpdated}
                  filesSkipped={jobStatus.report.counts.filesSkipped}
                  filesFailed={jobStatus.report.counts.filesFailed}
                />
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

              {jobStatus.report.markdownOptions && (
                <div>
                  <h4 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Markdown Quality Controls
                  </h4>
                  <div className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-600 dark:text-zinc-400">Include title as H1:</span>
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">
                          {jobStatus.report.markdownOptions.includeTitleAsH1 ? 'ON' : 'OFF'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-600 dark:text-zinc-400">Normalize headings:</span>
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">
                          {jobStatus.report.markdownOptions.normalizeHeadings ? 'ON' : 'OFF'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-600 dark:text-zinc-400">Collapse blank lines:</span>
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">
                          {jobStatus.report.markdownOptions.collapseBlankLines ? 'ON' : 'OFF'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-600 dark:text-zinc-400">Strip empty sections:</span>
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">
                          {jobStatus.report.markdownOptions.stripEmptySections ? 'ON' : 'OFF'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

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

      {/* Changed Files Modal */}
      <ChangedFilesModal
        isOpen={showChangedFilesModal}
        onClose={() => setShowChangedFilesModal(false)}
        files={modalFiles}
        title="Export File Changes"
      />
    </Card>
  );
}
