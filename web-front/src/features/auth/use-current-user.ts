import { useEffect, useState } from 'react';
import type { UserRole } from '@job-tracker/shared';

import { useTaxonomyStore } from '@/features/taxonomies/taxonomy-store';

export type CurrentUser = {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  role: UserRole;
  /** ISO timestamp; null until the user picks a preset or skips onboarding. */
  onboardedAt: string | null;
};

/**
 * Cap on the session probe. Without it, an unreachable API leaves the whole app
 * gated behind whatever nginx decides to do with a dead upstream — on prod that
 * was a 502 after ~3s, and a hung upstream has no bound at all.
 */
const SESSION_REQUEST_TIMEOUT_MS = 5000;

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      SESSION_REQUEST_TIMEOUT_MS
    );
    let cancelled = false;

    const finish = (nextUser: CurrentUser | null) => {
      clearTimeout(timeoutId);

      // The cleanup aborts the request, which rejects the promise chain; without
      // this guard that would write state after unmount.
      if (cancelled) {
        return;
      }

      if (nextUser) {
        useTaxonomyStore.getState().bindUser(nextUser.id);
      }
      setUser(nextUser);
      setIsLoading(false);
    };

    fetch('/auth/me', { credentials: 'include', signal: controller.signal })
      .then((res) => (res.ok ? (res.json() as Promise<CurrentUser>) : null))
      .then(finish)
      .catch(() => finish(null));

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, []);

  return { user, isLoading };
}
