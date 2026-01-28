import { redirect } from 'next/navigation';

/**
 * Temporary redirect from old pilot route to new provider-specific route
 */
export default function PilotExportRedirect() {
  redirect('/freshdesk/export');
}
