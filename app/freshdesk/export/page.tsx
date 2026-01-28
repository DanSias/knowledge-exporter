import { checkFreshdeskEnv } from '@/lib/env';
import { ExportWizard } from './ExportWizard';

export default function FreshdeskExportPage() {
  const envConfig = checkFreshdeskEnv();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <div className="mx-auto max-w-5xl px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            Freshdesk Exporter
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Export Freshdesk Solutions articles to deterministic Markdown
          </p>
        </div>

        {/* Wizard */}
        <ExportWizard
          hasApiKey={envConfig.hasApiKey}
          hasHost={envConfig.hasHost}
          baseUrl={envConfig.baseUrl}
        />
      </div>
    </div>
  );
}
