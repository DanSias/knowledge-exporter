import { Alert } from '@/app/components/Alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/Card';
import { StepIndicator, Step } from '@/app/components/StepIndicator';
import { checkFreshdeskEnv } from '@/lib/env';

export default function ExportPilotPage() {
  const envConfig = checkFreshdeskEnv();

  const steps: Step[] = [
    { number: 1, title: 'Configure', status: 'current' },
    { number: 2, title: 'Scope', status: 'pending' },
    { number: 3, title: 'Options', status: 'pending' },
    { number: 4, title: 'Run', status: 'pending' },
    { number: 5, title: 'Results', status: 'pending' },
  ];

  const isConfigured = envConfig.hasApiKey && envConfig.hasHost;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <div className="mx-auto max-w-5xl px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            Knowledge Base Exporter (Pilot)
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Export Freshdesk Solutions articles to deterministic Markdown
          </p>
        </div>

        {/* Step Indicator */}
        <div className="mb-8">
          <StepIndicator steps={steps} />
        </div>

        {/* Step 1: Configure */}
        <Card>
          <CardHeader>
            <CardTitle>Step 1: Configure</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Environment Variable Status */}
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
                        envConfig.hasApiKey
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-zinc-400 dark:text-zinc-600'
                      }`}
                    >
                      {envConfig.hasApiKey ? '✓ Present' : '✗ Missing'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
                    <span className="font-mono text-sm text-zinc-600 dark:text-zinc-400">
                      FRESHDESK_HOST or FRESHDESK_DOMAIN
                    </span>
                    <span
                      className={`text-sm font-medium ${
                        envConfig.hasHost
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-zinc-400 dark:text-zinc-600'
                      }`}
                    >
                      {envConfig.hasHost ? '✓ Present' : '✗ Missing'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Resolved Base URL */}
              {envConfig.baseUrl && (
                <div>
                  <h4 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Resolved Base URL
                  </h4>
                  <div className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
                    <code className="text-sm text-zinc-900 dark:text-zinc-100">
                      {envConfig.baseUrl}
                    </code>
                  </div>
                </div>
              )}

              {/* Warning if not configured */}
              {!isConfigured && (
                <Alert variant="warning">
                  <p className="font-medium">Missing required configuration</p>
                  <p className="mt-1">
                    Please set the following environment variables to continue:
                  </p>
                  <ul className="mt-2 list-inside list-disc space-y-1 text-sm">
                    {!envConfig.hasApiKey && (
                      <li>
                        <code className="font-mono">FRESHDESK_API_KEY</code>
                      </li>
                    )}
                    {!envConfig.hasHost && (
                      <li>
                        <code className="font-mono">FRESHDESK_HOST</code> or{' '}
                        <code className="font-mono">FRESHDESK_DOMAIN</code>
                      </li>
                    )}
                  </ul>
                </Alert>
              )}

              {/* Success message if configured */}
              {isConfigured && (
                <Alert variant="success">
                  <p className="font-medium">Configuration complete</p>
                  <p className="mt-1 text-sm">
                    All required environment variables are present. Ready to proceed to scope
                    selection.
                  </p>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Placeholder for future steps */}
        <div className="mt-6 rounded-lg border border-dashed border-zinc-300 bg-zinc-100 px-6 py-8 text-center dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-sm text-zinc-500 dark:text-zinc-500">
            Steps 2-5 will be implemented in future iterations
          </p>
        </div>
      </div>
    </div>
  );
}
