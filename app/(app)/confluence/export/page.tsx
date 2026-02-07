import { checkConfluenceEnv } from '@/lib/env';
import { ExportWizard } from './ExportWizard';

export default function ConfluenceExportPage() {
  const envConfig = checkConfluenceEnv();

  return (
    <div className="flex h-full flex-col bg-zinc-50 dark:bg-black">
      <div className="mx-auto w-full max-w-5xl px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            Confluence Exporter
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Export Confluence spaces to deterministic Markdown
          </p>
        </div>
      </div>

      {/* Client Component - takes remaining space */}
      <div className="flex-1 overflow-hidden">
        <div className="mx-auto h-full w-full max-w-5xl px-6 pb-8">
          <ExportWizard
            hasSite={envConfig.hasSite}
            hasEmail={envConfig.hasEmail}
            hasApiToken={envConfig.hasApiToken}
            siteUrl={envConfig.siteUrl}
          />
        </div>
      </div>
    </div>
  );
}
