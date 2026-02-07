import { NextResponse } from 'next/server';
import { checkFreshdeskEnv } from '@/lib/env';
import { estimateFreshdeskExport } from '@/lib/exporters/freshdesk/estimate';
import { ExportScope, ExportOptions } from '@/lib/exporters/types';

/**
 * POST /api/export/freshdesk/estimate
 * Get pre-export estimate without writing files
 */
export async function POST(request: Request) {
  try {
    // Check environment configuration
    const envConfig = checkFreshdeskEnv();

    if (!envConfig.hasHost || !envConfig.hasApiKey) {
      return NextResponse.json(
        { error: 'Missing Freshdesk environment variables' },
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
    const estimate = await estimateFreshdeskExport(exportScope, exportOptions);

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
