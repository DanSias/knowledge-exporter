/**
 * Environment variable utilities
 * Server-side only - do not import in client components
 */

export interface EnvConfig {
  hasApiKey: boolean;
  hasHost: boolean;
  baseUrl: string | null;
}

export interface ConfluenceEnvConfig {
  hasSite: boolean;
  hasEmail: boolean;
  hasApiToken: boolean;
  siteUrl: string | null;
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

/**
 * Check for presence of required Confluence environment variables
 * Returns detection status and resolved site URL if available
 */
export function checkConfluenceEnv(): ConfluenceEnvConfig {
  const site = process.env.ATLASSIAN_SITE;
  const email = process.env.ATLASSIAN_EMAIL;
  const apiToken = process.env.ATLASSIAN_API_TOKEN;

  const hasSite = !!site;
  const hasEmail = !!email;
  const hasApiToken = !!apiToken;

  let siteUrl: string | null = null;
  if (hasSite && site) {
    // Remove trailing /wiki if present for display
    siteUrl = site.replace(/\/wiki\/?$/, '');
  }

  return {
    hasSite,
    hasEmail,
    hasApiToken,
    siteUrl,
  };
}
