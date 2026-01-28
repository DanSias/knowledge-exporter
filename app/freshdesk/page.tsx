import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/Card';

export default function FreshdeskPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <div className="mx-auto max-w-5xl px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            Freshdesk
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Connect to Freshdesk Solutions and export knowledge base content to deterministic Markdown.
            Browse articles, run exports, and generate structured documentation from your support content.
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Export Card */}
          <Link href="/freshdesk/export" className="group">
            <Card className="h-full transition-all hover:border-blue-500 hover:shadow-md dark:hover:border-blue-400">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">📤</span>
                  Export
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Run the guided export wizard to generate Markdown files and reports.
                  Configure scope, options, and output settings through an interactive step-by-step interface.
                </p>
                <div className="mt-4 flex items-center text-sm font-medium text-blue-600 group-hover:text-blue-700 dark:text-blue-400 dark:group-hover:text-blue-300">
                  Start export wizard
                  <svg
                    className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Explore Card */}
          <Link href="/freshdesk/explore" className="group">
            <Card className="h-full transition-all hover:border-blue-500 hover:shadow-md dark:hover:border-blue-400">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">🔍</span>
                  Explore
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Browse categories, folders, and articles in a tree view.
                  Preview article content and verify HTML rendering before running exports.
                </p>
                <div className="mt-4 flex items-center text-sm font-medium text-blue-600 group-hover:text-blue-700 dark:text-blue-400 dark:group-hover:text-blue-300">
                  Browse knowledge base
                  <svg
                    className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
