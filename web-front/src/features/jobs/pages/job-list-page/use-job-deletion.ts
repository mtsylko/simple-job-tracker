import { useCallback, useState } from 'react';

import type { JobRow } from '@/features/jobs/types';
import { notifyActionError, notifyActionSuccess } from '@/lib/notifications';

/** Holds the job awaiting delete confirmation, tracks the in-flight delete and reports the outcome as a toast. */
export function useJobDeletion(onDelete: (id: string) => Promise<void>) {
  const [deletingJobId, setDeletingJobId] = useState<string | null>(null);
  const [jobPendingDeletion, setJobPendingDeletion] = useState<JobRow | null>(
    null
  );

  const requestDelete = useCallback((job: JobRow) => {
    setJobPendingDeletion(job);
  }, []);

  const cancelDelete = useCallback(() => {
    setJobPendingDeletion(null);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!jobPendingDeletion) return;
    const { id } = jobPendingDeletion;
    setDeletingJobId(id);
    try {
      await onDelete(id);
      notifyActionSuccess('deleted', 'job');
      setJobPendingDeletion(null);
    } catch (error) {
      // Keep the dialog open so the user can retry after the error toast.
      notifyActionError('deleted', 'job', error);
    } finally {
      setDeletingJobId(null);
    }
  }, [jobPendingDeletion, onDelete]);

  return {
    deletingJobId,
    jobPendingDeletion,
    requestDelete,
    cancelDelete,
    confirmDelete
  };
}
