import { Alert } from '@/app/components/Alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/Card';

interface StepConfigureProps {
  hasSite: boolean;
  hasEmail: boolean;
  hasApiToken: boolean;
  siteUrl: string | null;
  isConfigured: boolean;
  onContinue: () => void;
}

export function StepConfigure({
  hasSite,
  hasEmail,
  hasApiToken,
  siteUrl,
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
                  ATLASSIAN_SITE
                </span>
                <span
                  className={`text-sm font-medium ${
                    hasSite
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-zinc-400 dark:text-zinc-600'
                  }`}
                >
                  {hasSite ? '✓ Present' : '✗ Missing'}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
                <span className="font-mono text-sm text-zinc-600 dark:text-zinc-400">
                  ATLASSIAN_EMAIL
                </span>
                <span
                  className={`text-sm font-medium ${
                    hasEmail
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-zinc-400 dark:text-zinc-600'
                  }`}
                >
                  {hasEmail ? '✓ Present' : '✗ Missing'}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
                <span className="font-mono text-sm text-zinc-600 dark:text-zinc-400">
                  ATLASSIAN_API_TOKEN
                </span>
                <span
                  className={`text-sm font-medium ${
                    hasApiToken
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-zinc-400 dark:text-zinc-600'
                  }`}
                >
                  {hasApiToken ? '✓ Present' : '✗ Missing'}
                </span>
              </div>
            </div>
          </div>

          {siteUrl && (
            <div>
              <h4 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Resolved Site URL
              </h4>
              <div className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
                <code className="text-sm text-zinc-900 dark:text-zinc-100">{siteUrl}</code>
              </div>
            </div>
          )}

          {!isConfigured && (
            <Alert variant="warning">
              <p className="font-medium">Missing required configuration</p>
              <p className="mt-1">Please set the following environment variables to continue:</p>
              <ul className="mt-2 list-inside list-disc space-y-1 text-sm">
                {!hasSite && (
                  <li>
                    <code className="font-mono">ATLASSIAN_SITE</code>
                  </li>
                )}
                {!hasEmail && (
                  <li>
                    <code className="font-mono">ATLASSIAN_EMAIL</code>
                  </li>
                )}
                {!hasApiToken && (
                  <li>
                    <code className="font-mono">ATLASSIAN_API_TOKEN</code>
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
