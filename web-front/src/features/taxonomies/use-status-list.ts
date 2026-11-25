import { useCallback, useEffect } from 'react';
import type {
  CreateJobStatusOptionInput,
  JobStatusOption,
  UpdateJobStatusOptionInput
} from '@job-tracker/shared';

import { jobStatusTaxonomy } from '@/features/jobs/job-api';
import { useJobsStore } from '@/features/jobs/job-store';
import i18n from '@/i18n';
import { notify, notifyActionError } from '@/lib/notifications';
import { useTaxonomyStore } from '@/features/taxonomies/taxonomy-store';

export type StatusListState = {
  options: JobStatusOption[];
  isLoading: boolean;
  error: string | null;
};

export function useStatusList() {
  const state = useTaxonomyStore((store) => store.status);
  const ensureLoaded = useTaxonomyStore((store) => store.ensureLoaded);
  const reloadStatus = useTaxonomyStore((store) => store.reloadStatus);
  const setStatusOptions = useTaxonomyStore((store) => store.setStatusOptions);

  useEffect(() => {
    ensureLoaded();
  }, [ensureLoaded]);

  const add = useCallback(
    async (input: CreateJobStatusOptionInput) => {
      await jobStatusTaxonomy.create(input);
      await reloadStatus();
    },
    [reloadStatus]
  );

  // Colour and kind are resolved onto each job row, so editing them (like a
  // rename) must invalidate the applications list cache.
  const update = useCallback(
    async (id: string, input: UpdateJobStatusOptionInput) => {
      await jobStatusTaxonomy.update(id, input);
      await reloadStatus();
      useJobsStore.getState().invalidateJobs();
    },
    [reloadStatus]
  );

  const remove = useCallback(
    async (id: string) => {
      try {
        await jobStatusTaxonomy.remove(id);
      } catch (error) {
        notifyActionError('deleted', 'jobStatus', error);
        return;
      }
      await reloadStatus();
      useJobsStore.getState().invalidateJobs();
    },
    [reloadStatus]
  );

  const setDefault = useCallback(
    async (id: string) => {
      try {
        await jobStatusTaxonomy.setDefault(id);
      } catch (error) {
        notifyActionError('updated', 'jobStatus', error);
        return;
      }
      await reloadStatus();
    },
    [reloadStatus]
  );

  const reorder = useCallback(
    async (orderedIds: string[]) => {
      const current = useTaxonomyStore.getState().status.options;
      const byId = new Map(current.map((option) => [option.id, option]));
      const reordered = orderedIds
        .map((id) => byId.get(id))
        .filter((option): option is JobStatusOption => option !== undefined)
        .map((option, index) => ({ ...option, sortOrder: index }));

      setStatusOptions(reordered);

      // The drop handler has nowhere to show an error, so the rollback is explained by a toast
      try {
        await jobStatusTaxonomy.reorder(orderedIds);
      } catch (error) {
        await reloadStatus();
        notify.error(
          i18n.t('reorderError', { ns: 'taxonomies' }),
          error instanceof Error ? error.message : undefined
        );
      }
    },
    [reloadStatus, setStatusOptions]
  );

  return { state, add, update, remove, setDefault, reorder };
}
