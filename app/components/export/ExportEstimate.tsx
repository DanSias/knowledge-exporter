import { Alert } from '@/app/components/Alert';

export interface ExportEstimateData {
  provider: 'freshdesk' | 'confluence';
  scopeSummary: string;
  estimatedFiles: number | null;
  estimatedSizeBytes: number | null;
  warnings: string[];
  notes: string[];
}

interface ExportEstimateProps {
  estimate: ExportEstimateData | null;
  loading: boolean;
  error: string | null;
}

/**
 * ExportEstimate - Shows pre-export estimate with warnings
 */
export function ExportEstimate({ estimate, loading, error }: ExportEstimateProps) {
  if (loading) {
    return (
      <div className="rounded-md border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
          <span>Calculating estimate...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="warning">
        <p className="text-sm">
          <strong>Unable to estimate export:</strong> {error}
        </p>
        <p className="mt-1 text-sm">You can still proceed with the export.</p>
      </Alert>
    );
  }

  if (!estimate) {
    return null;
  }

  function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  }

  return (
    <div className="space-y-3">
      <div className="rounded-md border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/30">
        <h4 className="mb-3 text-sm font-semibold text-blue-900 dark:text-blue-100">
          Export Preview
        </h4>

        <div className="space-y-2 text-sm">
          {/* Scope Summary */}
          <div className="flex items-center justify-between">
            <span className="text-zinc-600 dark:text-zinc-400">Scope:</span>
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {estimate.scopeSummary}
            </span>
          </div>

          {/* Estimated Files */}
          <div className="flex items-center justify-between">
            <span className="text-zinc-600 dark:text-zinc-400">Estimated files:</span>
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {estimate.estimatedFiles !== null ? (
                <>~{estimate.estimatedFiles}</>
              ) : (
                <span className="text-zinc-500 dark:text-zinc-500">Unknown</span>
              )}
            </span>
          </div>

          {/* Optional Size Estimate */}
          {estimate.estimatedSizeBytes !== null && (
            <div className="flex items-center justify-between">
              <span className="text-zinc-600 dark:text-zinc-400">Estimated size:</span>
              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                ~{formatBytes(estimate.estimatedSizeBytes)}
              </span>
            </div>
          )}
        </div>

        {/* Notes */}
        {estimate.notes.length > 0 && (
          <div className="mt-3 space-y-1">
            {estimate.notes.map((note, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                <span className="flex-shrink-0 mt-0.5">ℹ️</span>
                <span>{note}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Warnings */}
      {estimate.warnings.length > 0 && (
        <Alert variant="warning">
          <div className="space-y-1">
            {estimate.warnings.map((warning, idx) => (
              <p key={idx} className="text-sm">
                {warning}
              </p>
            ))}
          </div>
        </Alert>
      )}
    </div>
  );
}
