import type { UserRole } from './user-roles';

/** One account as the admin users list shows it: counts and dates, never the records themselves. */
export interface AdminUserSummary {
  id: string;
  email: string;
  displayName: string | null;
  role: UserRole;
  createdAt: string;
  /** Latest edit to any of the user's applications or CV versions, or null before the first. */
  lastActiveAt: string | null;
  applicationCount: number;
  cvVersionCount: number;
  /** AI calls used on the current UTC day. */
  aiCallsToday: number;
}

/** The account an admin is viewing, as the app's banner names it. */
export interface AdminViewTarget {
  id: string;
  email: string;
  displayName: string | null;
}

/** Request header naming the account an admin is viewing; the API answers that request as that user, read-only. */
export const VIEW_AS_HEADER = 'x-view-as-user';

/** How long a view opened from the users list stays usable before it must be opened again. */
export const ADMIN_VIEW_SESSION_HOURS = 12;
