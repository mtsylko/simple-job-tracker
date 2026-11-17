import {
  differenceInCalendarDays,
  formatDistanceToNowStrict,
  isValid,
  parseISO,
  type Locale
} from 'date-fns';
import type { AdminUserSummary } from '@job-tracker/shared';

export const ACTIVE_WINDOW_DAYS = 30;

function toDate(value: string | null): Date | null {
  if (!value) {
    return null;
  }
  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : null;
}

/** Most recently active first; accounts never active go last, newest sign-ups first among them. */
export function sortByActivity(users: AdminUserSummary[]): AdminUserSummary[] {
  const time = (value: string | null) => toDate(value)?.getTime() ?? -Infinity;

  return [...users].sort(
    (a, b) =>
      time(b.lastActiveAt) - time(a.lastActiveAt) ||
      time(b.createdAt) - time(a.createdAt)
  );
}

export function summarizeActivity(users: AdminUserSummary[], now = new Date()) {
  return {
    total: users.length,
    active: users.filter((user) => {
      const last = toDate(user.lastActiveAt);
      return (
        last !== null &&
        differenceInCalendarDays(now, last) < ACTIVE_WINDOW_DAYS
      );
    }).length,
    aiCallsToday: users.reduce((sum, user) => sum + user.aiCallsToday, 0)
  };
}

/** "today", "yesterday", or a rounded distance such as "3 days ago"; null when there is no date. */
export function describeRecency(
  value: string | null,
  locale: Locale,
  now = new Date()
): { kind: 'today' | 'yesterday' | 'ago'; text: string } | null {
  const date = toDate(value);
  if (!date) {
    return null;
  }

  const days = differenceInCalendarDays(now, date);
  if (days <= 0) {
    return { kind: 'today', text: '' };
  }
  if (days === 1) {
    return { kind: 'yesterday', text: '' };
  }
  return {
    kind: 'ago',
    text: formatDistanceToNowStrict(date, {
      addSuffix: true,
      roundingMethod: 'floor',
      locale
    })
  };
}
