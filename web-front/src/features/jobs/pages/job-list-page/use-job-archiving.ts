import { useCallback, useState } from 'react';

import { isArchived, type JobRow } from '@/features/jobs/types';
import { notifyActionError, notifyActionSuccess } from '@/lib/notifications';

/**
 * Flips a job between active and archived, tracks the in-flight request and
 * reports the outcome as a toast with an Undo. No confirmation dialog, unlike
 * deletion: the toast and the same menu both take it back.
 */
export function useJobArchiving(
  onSetArchived: (id: string, archived: boolean) => Promise<void>
) {
  const [archivingJobId, setArchivingJobId] = useState<string | null>(null);

  // The Undo: the same request the other way, reported without an Undo of its own
  const undoArchive = useCallback(
    (id: string, archived: boolean) => {
      const action = archived ? 'archived' : 'restored';
      void onSetArchived(id, archived)
        .then(() => notifyActionSuccess(action, 'job'))
        .catch((error: unknown) => notifyActionError(action, 'job', error));
    },
    [onSetArchived]
  );

  const toggleArchive = useCallback(
    (job: JobRow) => {
      const archived = !isArchived(job);
      const action = archived ? 'archived' : 'restored';
      setArchivingJobId(job.id);

      void onSetArchived(job.id, archived)
        .then(() =>
          notifyActionSuccess(action, 'job', {
            undo: () => undoArchive(job.id, !archived)
          })
        )
        .catch((error: unknown) => notifyActionError(action, 'job', error))
        .finally(() => setArchivingJobId(null));
    },
    [onSetArchived, undoArchive]
  );

  return { archivingJobId, toggleArchive };
}
