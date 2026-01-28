import { notFound } from 'next/navigation';
import fs from 'fs/promises';
import path from 'path';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Link from 'next/link';

// Map slugs to markdown filenames
const DOCS_MAP: Record<string, string> = {
  'quick-start': 'QUICK_START.md',
  'implementation': 'EXPORT_IMPLEMENTATION.md',
  'manual-testing': 'MANUAL_TEST_GUIDE.md',
  'pilot-setup': 'PILOT_SETUP.md',
  'freshdesk-preview': 'FRESHDESK_PREVIEW.md',
  'phase1-summary': 'PHASE1_SUMMARY.md',
  'cleanup': 'CLEANUP_SUMMARY.md',
  'home-preview': 'HOME_PAGE_PREVIEW.md',
};

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return Object.keys(DOCS_MAP).map((slug) => ({
    slug,
  }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const filename = DOCS_MAP[slug];

  if (!filename) {
    return { title: 'Not Found' };
  }

  // Convert filename to title
  const title = filename
    .replace('.md', '')
    .replace(/_/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');

  return {
    title: `${title} - Knowledge Exporter`,
  };
}

export default async function DocPage({ params }: PageProps) {
  const { slug } = await params;
  const filename = DOCS_MAP[slug];

  if (!filename) {
    notFound();
  }

  // Read markdown file from repo root
  const filePath = path.join(process.cwd(), filename);

  let content: string;
  try {
    content = await fs.readFile(filePath, 'utf-8');
  } catch (error) {
    console.error(`Failed to read ${filename}:`, error);
    notFound();
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <div className="mx-auto max-w-4xl px-6 py-12">
        {/* Back navigation */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            ← Back to Home
          </Link>
        </div>

        {/* Markdown content */}
        <article className="markdown-body">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children }) => (
                <h1 className="mb-6 mt-8 text-4xl font-bold text-zinc-900 dark:text-zinc-50">
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className="mb-4 mt-8 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="mb-3 mt-6 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                  {children}
                </h3>
              ),
              h4: ({ children }) => (
                <h4 className="mb-2 mt-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  {children}
                </h4>
              ),
              p: ({ children }) => (
                <p className="mb-4 leading-7 text-zinc-700 dark:text-zinc-300">{children}</p>
              ),
              a: ({ href, children }) => (
                <a
                  href={href}
                  className="text-blue-600 underline decoration-blue-600/30 hover:text-blue-700 hover:decoration-blue-700 dark:text-blue-400 dark:decoration-blue-400/30 dark:hover:text-blue-300"
                >
                  {children}
                </a>
              ),
              ul: ({ children }) => (
                <ul className="mb-4 ml-6 list-disc space-y-2 text-zinc-700 dark:text-zinc-300">
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className="mb-4 ml-6 list-decimal space-y-2 text-zinc-700 dark:text-zinc-300">
                  {children}
                </ol>
              ),
              li: ({ children }) => <li className="leading-7">{children}</li>,
              code: ({ className, children }) => {
                const isInline = !className;
                if (isInline) {
                  return (
                    <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-sm font-mono text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">
                      {children}
                    </code>
                  );
                }
                return (
                  <code className="text-sm font-mono text-zinc-100 dark:text-zinc-100">
                    {children}
                  </code>
                );
              },
              pre: ({ children }) => (
                <pre className="mb-4 overflow-x-auto rounded-lg bg-zinc-900 p-4 text-sm dark:bg-zinc-950">
                  {children}
                </pre>
              ),
              blockquote: ({ children }) => (
                <blockquote className="mb-4 border-l-4 border-zinc-300 pl-4 italic text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
                  {children}
                </blockquote>
              ),
              table: ({ children }) => (
                <div className="mb-4 overflow-x-auto">
                  <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
                    {children}
                  </table>
                </div>
              ),
              thead: ({ children }) => (
                <thead className="bg-zinc-50 dark:bg-zinc-900">{children}</thead>
              ),
              tbody: ({ children }) => (
                <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-800 dark:bg-black">
                  {children}
                </tbody>
              ),
              tr: ({ children }) => <tr>{children}</tr>,
              th: ({ children }) => (
                <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td className="px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300">
                  {children}
                </td>
              ),
              hr: () => <hr className="my-8 border-zinc-200 dark:border-zinc-800" />,
            }}
          >
            {content}
          </ReactMarkdown>
        </article>
      </div>
    </div>
  );
}
