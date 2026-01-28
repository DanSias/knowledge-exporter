/**
 * Confluence Cloud API client
 * Uses Basic Authentication (email:token)
 */

const ATLASSIAN_SITE = process.env.ATLASSIAN_SITE;
const ATLASSIAN_EMAIL = process.env.ATLASSIAN_EMAIL;
const ATLASSIAN_API_TOKEN = process.env.ATLASSIAN_API_TOKEN;

/**
 * Fetch wrapper for Confluence API with Basic Auth
 */
export async function confluenceFetch<T>(endpoint: string): Promise<T> {
  if (!ATLASSIAN_SITE) {
    throw new Error('ATLASSIAN_SITE environment variable is not set');
  }

  if (!ATLASSIAN_EMAIL) {
    throw new Error('ATLASSIAN_EMAIL environment variable is not set');
  }

  if (!ATLASSIAN_API_TOKEN) {
    throw new Error('ATLASSIAN_API_TOKEN environment variable is not set');
  }

  // Ensure ATLASSIAN_SITE includes /wiki
  let baseSite = ATLASSIAN_SITE;
  if (!baseSite.includes('/wiki')) {
    baseSite = `${baseSite}/wiki`;
  }
  // Remove trailing slash
  baseSite = baseSite.replace(/\/$/, '');

  const url = `${baseSite}${endpoint}`;

  // Debug logging (safe - no credentials)
  if (process.env.NODE_ENV !== 'production') {
    console.log('[Confluence API] Request URL:', url);
  }

  // Create Basic Auth header (email:token base64 encoded)
  const authString = `${ATLASSIAN_EMAIL}:${ATLASSIAN_API_TOKEN}`;
  const authHeader = `Basic ${Buffer.from(authString).toString('base64')}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': authHeader,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorText = await response.text();
    const errorPreview = errorText.substring(0, 200);
    console.error(`[Confluence API] Error ${response.status} for ${endpoint}:`, errorPreview);
    throw new Error(
      `Confluence API error: ${response.status} ${response.statusText} - ${errorPreview}`
    );
  }

  if (process.env.NODE_ENV !== 'production') {
    console.log('[Confluence API] Success:', response.status);
  }

  return response.json();
}
