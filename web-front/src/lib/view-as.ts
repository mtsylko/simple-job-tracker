import { VIEW_AS_HEADER, type AdminViewTarget } from '@job-tracker/shared';

// Per tab on purpose: another tab, and the extension, keep the admin's own account.
const STORAGE_KEY = 'jt.viewAs';

/** The account this tab is viewing as an admin, or null for the admin's own. */
export function getViewAs(): AdminViewTarget | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AdminViewTarget) : null;
  } catch {
    return null;
  }
}

export function setViewAs(target: AdminViewTarget): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(target));
  } catch {
    // Storage blocked: the view simply does not open.
  }
}

export function clearViewAs(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing stored to clear.
  }
}

/** The header naming the viewed account; admin routes always answer as the admin. */
export function viewAsHeaders(url: string): Record<string, string> {
  const target = getViewAs();

  return target && !url.startsWith('/api/admin/')
    ? { [VIEW_AS_HEADER]: target.id }
    : {};
}
