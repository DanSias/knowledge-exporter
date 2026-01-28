import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './Card';

interface StepPanelProps {
  stepNumber: number;
  title: string;
  isActive: boolean;
  isCompleted: boolean;
  summary?: string;
  children: React.ReactNode;
}

export function StepPanel({
  stepNumber,
  title,
  isActive,
  isCompleted,
  summary,
  children,
}: StepPanelProps) {
  const [showDetails, setShowDetails] = useState(false);

  // Active step: always expanded
  if (isActive) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Step {stepNumber}: {title}</CardTitle>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    );
  }

  // Completed step: collapsible with summary
  if (isCompleted) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle>Step {stepNumber}: {title}</CardTitle>
              <span className="text-sm text-green-600 dark:text-green-400">✓</span>
            </div>
            <button
              onClick={() => setShowDetails(!showDetails)}
              aria-expanded={showDetails}
              className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              {showDetails ? 'Hide details' : 'Show details'}
            </button>
          </div>
        </CardHeader>
        {showDetails ? (
          <CardContent>{children}</CardContent>
        ) : (
          summary && (
            <CardContent>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">{summary}</p>
            </CardContent>
          )
        )}
      </Card>
    );
  }

  // Future step: not rendered
  return null;
}
