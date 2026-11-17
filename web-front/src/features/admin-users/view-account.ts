import { ROUTES } from '@/app/routes';
import { clearViewAs, getViewAs, setViewAs } from '@/lib/view-as';

import { endViewSession, startViewSession } from './admin-users-api';

// Both directions reload the page, so no store keeps the other account's rows.

export async function openAccount(userId: string): Promise<void> {
  setViewAs(await startViewSession(userId));
  window.location.assign(ROUTES.applications);
}

export async function exitAccount(): Promise<void> {
  const target = getViewAs();

  if (target) {
    // Leave even if the call fails: the server still drops the view after its time limit.
    await endViewSession(target.id).catch(() => undefined);
  }

  clearViewAs();
  window.location.assign(ROUTES.adminUsers);
}
