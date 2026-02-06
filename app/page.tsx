import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/Card';

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <div className="mx-auto max-w-4xl px-6 py-12">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="mb-3 text-4xl font-bold text-zinc-900 dark:text-zinc-50">
            Knowledge Exporter
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
            Export support knowledge bases and wikis to deterministic Markdown files.
            Supports Freshdesk Solutions and Confluence Cloud.
            Perfect for feeding into documentation systems, AI tools, or version control.
          </p>
        </div>

        {/* Get Started - Primary CTAs */}
        <div className="mb-10">
          <h2 className="mb-4 text-center text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Get Started
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {/* Freshdesk CTA */}
            <Card className="transition-shadow hover:shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-blue-600 dark:text-blue-400">Freshdesk Solutions</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
                  Export knowledge base articles to Markdown with category and folder structure
                </p>
                <Link
                  href="/freshdesk/export"
                  className="flex items-center justify-center rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Start Freshdesk Export →
                </Link>
                <div className="mt-3 text-center">
                  <Link
                    href="/freshdesk/explore"
                    className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 underline decoration-transparent hover:decoration-current transition-colors"
                  >
                    Explore Freshdesk →
                  </Link>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
                    Browse categories and articles before exporting
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Confluence CTA */}
            <Card className="transition-shadow hover:shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-blue-600 dark:text-blue-400">Confluence Cloud</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
                  Export Confluence spaces and pages to Markdown with space-based organization
                </p>
                <Link
                  href="/confluence/export"
                  className="flex items-center justify-center rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Start Confluence Export →
                </Link>
                <div className="mt-3 text-center">
                  <Link
                    href="/confluence/explore"
                    className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 underline decoration-transparent hover:decoration-current transition-colors"
                  >
                    Explore Confluence →
                  </Link>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
                    Browse spaces and pages before exporting
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Secondary: Exports Inventory */}
          <div className="mt-6 text-center">
            <Link
              href="/exports"
              className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
            >
              <span>Browse Exports Inventory</span>
              <span>→</span>
            </Link>
            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
              Inspect previously exported Markdown files
            </p>
          </div>
        </div>

        {/* How It Works */}
        <Card className="mb-7">
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2.5 text-zinc-700 dark:text-zinc-300">
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
                  <strong>Select scope</strong> - Choose which categories/spaces and articles/pages to export
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
                  <strong>Use results</strong> - Feed exported files into your documentation system, AI pipeline, or version control
                </span>
              </li>
            </ol>
          </CardContent>
        </Card>

        {/* Features Grid */}
        <div className="mb-7 grid gap-5 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Deterministic Output</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Consistent file paths and naming for reliable, repeatable exports
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
              <CardTitle>Live Progress Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Watch real-time export progress with live file counts and phase updates
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Documentation Links */}
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
