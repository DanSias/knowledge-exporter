/**
 * Generate default run name for exports
 */

/**
 * Generate a default run name with timestamp
 * Format: <provider>-YYYY-MM-DD-HHmm
 */
export function generateDefaultRunName(provider: 'freshdesk' | 'confluence'): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');

  return `${provider}-${year}-${month}-${day}-${hours}${minutes}`;
}

/**
 * Build the full output directory path
 * Format: ./exports/<provider>/<runName>/
 */
export function buildOutputPath(
  baseDir: string,
  provider: 'freshdesk' | 'confluence',
  runName?: string
): string {
  const actualRunName = runName || generateDefaultRunName(provider);
  return `${baseDir}/${provider}/${actualRunName}`;
}
