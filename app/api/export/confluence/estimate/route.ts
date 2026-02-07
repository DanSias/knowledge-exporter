import { NextResponse } from 'next/server';
import { checkConfluenceEnv } from '@/lib/env';
import { estimateConfluenceExport } from '@/lib/exporters/confluence/estimate';
import { ExportScope, ExportOptions } from '@/lib/exporters/types';

/**
 * POST /api/export/confluence/estimate
 * Get pre-export estimate without fetching page bodies
 */
export async function POST(request: Request) {
  try {
    // Check environment configuration
    const envConfig = checkConfluenceEnv();

    if (!envConfig.hasSite || !envConfig.hasEmail || !envConfig.hasApiToken) {
      return NextResponse.json(
        { error: 'Missing Confluence environment variables' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { scope, options } = body;

    if (!scope) {
      return NextResponse.json({ error: 'Missing scope parameter' }, { status: 400 });
    }

    // Cast to proper types
    const exportScope: ExportScope = scope;
    const exportOptions: ExportOptions = options || {};

    // Get estimate
    const estimate = await estimateConfluenceExport(exportScope, exportOptions);

    return NextResponse.json(estimate);
  } catch (error) {
    console.error('Estimate error:', error);
    return NextResponse.json(
      {
        error: 'Failed to estimate export',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
