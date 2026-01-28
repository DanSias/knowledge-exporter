import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/Card';
import { Alert } from '@/app/components/Alert';

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <div className="mx-auto max-w-4xl px-6 py-12">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold text-zinc-900 dark:text-zinc-50">
            Knowledge Exporter
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
            Export support knowledge bases like Freshdesk Solutions to deterministic Markdown files.
            Perfect for feeding into documentation systems, AI tools, or version control.
            This tool handles export only—ingestion and search are handled by downstream tools like Verbatim.
          </p>
        </div>

        {/* Getting Started CTA */}
        <div className="mb-8">
          <Link
            href="/pilot/export"
            className="mx-auto flex w-full max-w-md items-center justify-center rounded-lg bg-blue-600 px-8 py-4 text-lg font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Start an Export →
          </Link>
        </div>

        {/* How It Works */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3 text-zinc-700 dark:text-zinc-300">
              <li className="flex gap-3">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600 dark:bg-blue-900 dark:text-blue-400">
                  1
                </span>
                <span>
                  <strong>Configure credentials</strong> - Set up your API key and host in environment variables
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600 dark:bg-blue-900 dark:text-blue-400">
                  2
                </span>
                <span>
                  <strong>Select scope</strong> - Choose which categories and articles to export
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600 dark:bg-blue-900 dark:text-blue-400">
                  3
                </span>
                <span>
                  <strong>Run export</strong> - Export to deterministic Markdown with idempotent writes
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600 dark:bg-blue-900 dark:text-blue-400">
                  4
                </span>
                <span>
                  <strong>Upload results</strong> - Use exported files in your documentation system, AI pipeline, or version control
                </span>
              </li>
            </ol>
          </CardContent>
        </Card>

        {/* Provider Support */}
        <Alert variant="info" className="mb-8">
          <div>
            <p className="font-medium">Freshdesk Solutions supported</p>
            <p className="mt-1 text-sm">
              Additional providers (Zendesk, Intercom, etc.) are planned for future releases.
            </p>
          </div>
        </Alert>

        {/* Features Grid */}
        <div className="mb-8 grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Deterministic Output</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Consistent file paths and naming: <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">kb/&lt;category&gt;/&lt;folder&gt;/&lt;slug&gt;.md</code>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Idempotent Writes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Smart re-runs: skip unchanged files, update modified content, create new files
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Clean Markdown</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                HTML converted to clean Markdown with preserved headings, lists, code blocks, and links
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Published Content Only</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Filters for published English articles only - no drafts or unpublished content
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Links */}
        <Card>
          <CardHeader>
            <CardTitle>Documentation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Link
                href="/docs/quick-start"
                className="block text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Quick Start Guide →
              </Link>
              <Link
                href="/docs/implementation"
                className="block text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Export Implementation Details →
              </Link>
              <Link
                href="/docs/manual-testing"
                className="block text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Manual Testing Guide →
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
