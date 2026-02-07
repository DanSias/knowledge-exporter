interface StatusBadgeProps {
  status: 'created' | 'updated' | 'skipped' | 'failed';
  size?: 'sm' | 'md';
}

/**
 * StatusBadge - Color-coded badge for file operation status
 */
export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm';

  const variants = {
    created: {
      bg: 'bg-green-100 dark:bg-green-950',
      text: 'text-green-700 dark:text-green-300',
      label: 'Created',
    },
    updated: {
      bg: 'bg-blue-100 dark:bg-blue-950',
      text: 'text-blue-700 dark:text-blue-300',
      label: 'Updated',
    },
    skipped: {
      bg: 'bg-zinc-100 dark:bg-zinc-800',
      text: 'text-zinc-600 dark:text-zinc-400',
      label: 'Skipped',
    },
    failed: {
      bg: 'bg-red-100 dark:bg-red-950',
      text: 'text-red-700 dark:text-red-300',
      label: 'Failed',
    },
  };

  const variant = variants[status];

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${sizeClasses} ${variant.bg} ${variant.text}`}
    >
      {variant.label}
    </span>
  );
}
