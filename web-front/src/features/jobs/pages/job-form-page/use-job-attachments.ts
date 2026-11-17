import { useCallback, useEffect, useState } from 'react';
import type { JobAttachment } from '@job-tracker/shared';

import {
  deleteJobAttachment,
  listJobAttachments,
  uploadJobAttachment
} from '@/features/jobs/job-attachments-api';
import { readErrorMessage } from '@/features/utils';

export type StagedAttachment = { key: string; file: File };

export type AttachmentSaveFailure = { fileName: string; message: string };

/** The application's files, with additions and removals held until the form saves. */
export function useJobAttachments(jobId: string | undefined) {
  const [saved, setSaved] = useState<JobAttachment[]>([]);
  const [isLoading, setIsLoading] = useState(Boolean(jobId));
  const [loadError, setLoadError] = useState<string | null>(null);
  const [staged, setStaged] = useState<StagedAttachment[]>([]);
  const [removedIds, setRemovedIds] = useState<ReadonlySet<string>>(
    () => new Set()
  );

  useEffect(() => {
    if (!jobId) return;
    // The form remounts per job, so loading starts true from the initial state.
    let cancelled = false;
    listJobAttachments(jobId)
      .then((list) => {
        if (!cancelled) setSaved(list);
      })
      .catch((error: unknown) => {
        if (!cancelled) setLoadError(readErrorMessage(error));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [jobId]);

  const stage = useCallback((file: File) => {
    setStaged((prev) => [...prev, { key: crypto.randomUUID(), file }]);
  }, []);

  const unstage = useCallback((key: string) => {
    setStaged((prev) => prev.filter((item) => item.key !== key));
  }, []);

  const toggleRemoved = useCallback((id: string) => {
    setRemovedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  /** Applies the held changes to the saved job; reports the files that failed. */
  async function commit(targetJobId: string): Promise<AttachmentSaveFailure[]> {
    const failures: AttachmentSaveFailure[] = [];

    for (const attachment of saved) {
      if (!removedIds.has(attachment.id)) continue;
      try {
        await deleteJobAttachment(targetJobId, attachment.id);
      } catch (error) {
        failures.push({
          fileName: attachment.fileName,
          message: readErrorMessage(error)
        });
      }
    }

    for (const { file } of staged) {
      try {
        await uploadJobAttachment(targetJobId, file);
      } catch (error) {
        failures.push({
          fileName: file.name,
          message: readErrorMessage(error)
        });
      }
    }

    return failures;
  }

  return {
    saved,
    staged,
    removedIds,
    isLoading,
    loadError,
    keptCount: saved.length - removedIds.size + staged.length,
    hasChanges: staged.length > 0 || removedIds.size > 0,
    stage,
    unstage,
    toggleRemoved,
    commit
  };
}

export type JobAttachmentsState = ReturnType<typeof useJobAttachments>;
