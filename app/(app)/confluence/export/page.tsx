import { checkConfluenceEnv } from '@/lib/env';
import { ExportWizard } from './ExportWizard';

export default function ConfluenceExportPage() {
  const envConfig = checkConfluenceEnv();

  return (
    <div className="bg-zinc-50 dark:bg-black">
      <div className="mx-auto max-w-5xl px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            Confluence Exporter
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Export Confluence spaces to deterministic Markdown
          </p>
        </div>

        {/* Wizard */}
        <ExportWizard
          hasSite={envConfig.hasSite}
          hasEmail={envConfig.hasEmail}
          hasApiToken={envConfig.hasApiToken}
          siteUrl={envConfig.siteUrl}
        />
      </div>
    </div>
  );
}
