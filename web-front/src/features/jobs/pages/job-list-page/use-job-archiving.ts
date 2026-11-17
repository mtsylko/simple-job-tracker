import { useCallback, useState } from 'react';

import { isArchived, type JobRow } from '@/features/jobs/types';
import { notifyActionError, notifyActionSuccess } from '@/lib/notifications';

/**
 * Flips a job between active and archived, tracks the in-flight request and
 * reports the outcome as a toast. No confirmation dialog, unlike deletion:
 * the same menu undoes it.
 */
export function useJobArchiving(
  onSetArchived: (id: string, archived: boolean) => Promise<void>
) {
  const [archivingJobId, setArchivingJobId] = useState<string | null>(null);

  const toggleArchive = useCallback(
    (job: JobRow) => {
      const action = isArchived(job) ? 'restored' : 'archived';
      setArchivingJobId(job.id);

      void onSetArchived(job.id, action === 'archived')
        .then(() => notifyActionSuccess(action, 'job'))
        .catch((error: unknown) => notifyActionError(action, 'job', error))
        .finally(() => setArchivingJobId(null));
    },
    [onSetArchived]
  );

  return { archivingJobId, toggleArchive };
}
