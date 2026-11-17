import { useEffect, useState } from 'react';
import type { JobFieldDefinition } from '@job-tracker/shared';

import { activeDefinitions } from '@/features/job-fields/active-definitions';
import { listJobFields } from '@/features/jobs/job-api';

/**
 * The user's field definitions rarely change, so they are fetched once per session
 * and shared across mounts — two forms opened at once issue a single request. The
 * custom fields sit at the end of the form, so a late arrival appends rather than
 * reshuffling; the form does not need to hold for them the way it does for order.
 */
let cached: JobFieldDefinition[] | null = null;
let pendingLoad: Promise<JobFieldDefinition[]> | null = null;

/** Called after the management screen mutates definitions so the next form open
 *  refetches instead of serving a stale session cache. */
export function invalidateJobFieldDefinitionsCache(): void {
  cached = null;
  pendingLoad = null;
}

function loadDefinitions(): Promise<JobFieldDefinition[]> {
  if (cached) {
    return Promise.resolve(cached);
  }

  pendingLoad ??= listJobFields()
    .then((definitions) => {
      cached = activeDefinitions(definitions);
      return cached;
    })
    .finally(() => {
      // Cleared either way so a failed load retries on the next form open.
      pendingLoad = null;
    });

  return pendingLoad;
}

export function useJobFieldDefinitions() {
  const [definitions, setDefinitions] = useState<JobFieldDefinition[]>(
    () => cached ?? []
  );
  const [isReady, setIsReady] = useState(cached !== null);

  useEffect(() => {
    if (cached) {
      return;
    }

    let cancelled = false;

    loadDefinitions()
      .then((loaded) => {
        if (!cancelled) {
          setDefinitions(loaded);
        }
      })
      .catch(() => {
        // A missing or unreachable definition list just means no custom fields —
        // not worth interrupting the form for.
      })
      .finally(() => {
        if (!cancelled) {
          setIsReady(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { definitions, isReady };
}
