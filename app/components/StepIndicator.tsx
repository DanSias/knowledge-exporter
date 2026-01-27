import React from 'react';

export interface Step {
  number: number;
  title: string;
  status: 'pending' | 'current' | 'complete';
}

interface StepIndicatorProps {
  steps: Step[];
}

export function StepIndicator({ steps }: StepIndicatorProps) {
  return (
    <nav aria-label="Progress">
      <ol className="flex items-center gap-2">
        {steps.map((step, idx) => (
          <li key={step.number} className="flex items-center gap-2">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors ${
                  step.status === 'complete'
                    ? 'border-green-500 bg-green-500 text-white'
                    : step.status === 'current'
                    ? 'border-blue-500 bg-blue-500 text-white'
                    : 'border-zinc-300 bg-white text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400'
                }`}
              >
                {step.number}
              </div>
              <span
                className={`text-sm font-medium ${
                  step.status === 'current'
                    ? 'text-blue-600 dark:text-blue-400'
                    : step.status === 'complete'
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-zinc-600 dark:text-zinc-400'
                }`}
              >
                {step.title}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div className="h-0.5 w-8 bg-zinc-200 dark:bg-zinc-800" />
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
