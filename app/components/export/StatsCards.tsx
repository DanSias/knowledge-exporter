interface StatsCardsProps {
  filesCreated: number;
  filesUpdated: number;
  filesSkipped: number;
  filesFailed?: number;
  pagesFailed?: number;
}

export function StatsCards({
  filesCreated,
  filesUpdated,
  filesSkipped,
  filesFailed,
  pagesFailed,
}: StatsCardsProps) {
  // Determine what to show for "failed" - prefer pagesFailed if provided
  const failedCount = pagesFailed !== undefined ? pagesFailed : filesFailed ?? 0;
  const failedLabel = pagesFailed !== undefined ? 'Failed' : 'Failed';

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      <div className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
          {filesCreated}
        </div>
        <div className="text-sm text-zinc-600 dark:text-zinc-400">Created</div>
      </div>
      <div className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
          {filesUpdated}
        </div>
        <div className="text-sm text-zinc-600 dark:text-zinc-400">Updated</div>
      </div>
      <div className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="text-2xl font-bold text-zinc-600 dark:text-zinc-400">
          {filesSkipped}
        </div>
        <div className="text-sm text-zinc-600 dark:text-zinc-400">Skipped</div>
      </div>
      <div className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="text-2xl font-bold text-red-600 dark:text-red-400">
          {failedCount}
        </div>
        <div className="text-sm text-zinc-600 dark:text-zinc-400">{failedLabel}</div>
      </div>
    </div>
  );
}
