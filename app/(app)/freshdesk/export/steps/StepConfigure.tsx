import { Alert } from '@/app/components/Alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/Card';

interface StepConfigureProps {
  hasApiKey: boolean;
  hasHost: boolean;
  baseUrl: string | null;
  isConfigured: boolean;
  onContinue: () => void;
}

export function StepConfigure({
  hasApiKey,
  hasHost,
  baseUrl,
  isConfigured,
  onContinue,
}: StepConfigureProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Step 1: Configure</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h4 className="mb-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Environment Variables
            </h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
                <span className="font-mono text-sm text-zinc-600 dark:text-zinc-400">
                  FRESHDESK_API_KEY
                </span>
                <span
                  className={`text-sm font-medium ${
                    hasApiKey
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-zinc-400 dark:text-zinc-600'
                  }`}
                >
                  {hasApiKey ? '✓ Present' : '✗ Missing'}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
                <span className="font-mono text-sm text-zinc-600 dark:text-zinc-400">
                  FRESHDESK_HOST or FRESHDESK_DOMAIN
                </span>
                <span
                  className={`text-sm font-medium ${
                    hasHost
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-zinc-400 dark:text-zinc-600'
                  }`}
                >
                  {hasHost ? '✓ Present' : '✗ Missing'}
                </span>
              </div>
            </div>
          </div>

          {baseUrl && (
            <div>
              <h4 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Resolved Base URL
              </h4>
              <div className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
                <code className="text-sm text-zinc-900 dark:text-zinc-100">{baseUrl}</code>
              </div>
            </div>
          )}

          {!isConfigured && (
            <Alert variant="warning">
              <p className="font-medium">Missing required configuration</p>
              <p className="mt-1">Please set the following environment variables to continue:</p>
              <ul className="mt-2 list-inside list-disc space-y-1 text-sm">
                {!hasApiKey && (
                  <li>
                    <code className="font-mono">FRESHDESK_API_KEY</code>
                  </li>
                )}
                {!hasHost && (
                  <li>
                    <code className="font-mono">FRESHDESK_HOST</code> or{' '}
                    <code className="font-mono">FRESHDESK_DOMAIN</code>
                  </li>
                )}
              </ul>
            </Alert>
          )}

          {isConfigured && (
            <>
              <Alert variant="success">
                <p className="font-medium">Configuration complete</p>
                <p className="mt-1 text-sm">All required environment variables are present.</p>
              </Alert>
              <button
                onClick={onContinue}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Continue to Scope Selection
              </button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
