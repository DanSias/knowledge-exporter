/**
 * Freshdesk API client
 * Server-side only
 */

import { checkFreshdeskEnv } from '@/lib/env';

export class FreshdeskClientError extends Error {
  constructor(
    message: string,
    public status?: number,
    public response?: unknown
  ) {
    super(message);
    this.name = 'FreshdeskClientError';
  }
}

/**
 * Resolve the Freshdesk base URL from environment variables
 * Uses existing checkFreshdeskEnv logic
 */
export function resolveBaseUrl(): string {
  const envConfig = checkFreshdeskEnv();

  if (!envConfig.hasApiKey) {
    throw new FreshdeskClientError('FRESHDESK_API_KEY environment variable is required');
  }

  if (!envConfig.hasHost) {
    throw new FreshdeskClientError(
      'FRESHDESK_HOST or FRESHDESK_DOMAIN environment variable is required'
    );
  }

  if (!envConfig.baseUrl) {
    throw new FreshdeskClientError('Unable to resolve Freshdesk base URL');
  }

  return envConfig.baseUrl;
}

/**
 * Get the API key from environment
 */
function getApiKey(): string {
  const apiKey = process.env.FRESHDESK_API_KEY;
  if (!apiKey) {
    throw new FreshdeskClientError('FRESHDESK_API_KEY environment variable is required');
  }
  return apiKey;
}

/**
 * Create Basic Auth header for Freshdesk API
 * Format: Basic base64(apiKey:X)
 */
function createAuthHeader(apiKey: string): string {
  const credentials = `${apiKey}:X`;
  const encoded = Buffer.from(credentials).toString('base64');
  return `Basic ${encoded}`;
}

/**
 * Fetch wrapper for Freshdesk API requests
 * Handles authentication and error responses
 */
export async function freshdeskFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const baseUrl = resolveBaseUrl();
  const apiKey = getApiKey();

  const url = `${baseUrl}${path}`;
  const headers = {
    'Authorization': createAuthHeader(apiKey),
    'Content-Type': 'application/json',
    ...init?.headers,
  };

  const response = await fetch(url, {
    ...init,
    headers,
    cache: 'no-store', // Disable caching for preview
  });

  if (!response.ok) {
    let errorMessage = `Freshdesk API error: ${response.status} ${response.statusText}`;
    let responseBody: unknown;

    try {
      responseBody = await response.json();
      errorMessage = `Freshdesk API error: ${response.status} - ${JSON.stringify(responseBody)}`;
    } catch {
      // Failed to parse JSON, use default message
    }

    throw new FreshdeskClientError(errorMessage, response.status, responseBody);
  }

  return response.json();
}
