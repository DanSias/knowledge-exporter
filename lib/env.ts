/**
 * Environment variable utilities
 * Server-side only - do not import in client components
 */

export interface EnvConfig {
  hasApiKey: boolean;
  hasHost: boolean;
  baseUrl: string | null;
}

/**
 * Check for presence of required Freshdesk environment variables
 * Returns detection status and resolved base URL if available
 */
export function checkFreshdeskEnv(): EnvConfig {
  const apiKey = process.env.FRESHDESK_API_KEY;
  const host = process.env.FRESHDESK_HOST || process.env.FRESHDESK_DOMAIN;

  const hasApiKey = !!apiKey;
  const hasHost = !!host;

  let baseUrl: string | null = null;
  if (hasHost && host) {
    // Normalize to URL format
    baseUrl = host.startsWith('http') ? host : `https://${host}`;
  }

  return {
    hasApiKey,
    hasHost,
    baseUrl,
  };
}
