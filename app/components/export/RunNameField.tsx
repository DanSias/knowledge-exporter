interface RunNameFieldProps {
  value: string;
  onChange: (value: string) => void;
  provider: 'freshdesk' | 'confluence';
}

export function RunNameField({ value, onChange, provider }: RunNameFieldProps) {
  const placeholder = `${provider}-2026-02-05-1530 (auto-generated if empty)`;

  return (
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
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        placeholder={placeholder}
      />
      <p className="mt-1 text-xs text-zinc-500">
        Custom name for this export run. If empty, auto-generated with timestamp.
      </p>
    </div>
  );
}
