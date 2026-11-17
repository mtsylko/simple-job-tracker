import { useCallback, useEffect } from 'react';
import type { JobTaxonomyOption } from '@job-tracker/shared';

import { useJobsStore } from '@/features/jobs/job-store';

import {
  createJobContractTypeOption,
  createJobEmploymentTypeOption,
  createJobLevelOption,
  createJobOutcomeOption,
  createJobRoleOption,
  createJobTypeOption,
  jobContractTypeTaxonomy,
  jobEmploymentTypeTaxonomy,
  jobLevelTaxonomy,
  jobOutcomeTaxonomy,
  jobRoleTaxonomy,
  jobTypeTaxonomy,
  type TaxonomyOptionClient
} from '@/features/jobs/job-api';
import {
  notifyActionError,
  notifyActionSuccess,
  type NotificationEntity
} from '@/lib/notifications';
import { useTaxonomyStore } from '@/features/taxonomies/taxonomy-store';

export type TaxonomyKind =
  | 'role'
  | 'level'
  | 'type'
  | 'employmentType'
  | 'contractType'
  | 'outcome';

export type TaxonomyListState = {
  options: JobTaxonomyOption[];
  isLoading: boolean;
  error: string | null;
};

const CLIENTS: Record<TaxonomyKind, TaxonomyOptionClient> = {
  role: jobRoleTaxonomy,
  level: jobLevelTaxonomy,
  type: jobTypeTaxonomy,
  employmentType: jobEmploymentTypeTaxonomy,
  contractType: jobContractTypeTaxonomy,
  outcome: jobOutcomeTaxonomy
};

const CREATE_FNS: Record<TaxonomyKind, (value: string) => Promise<void>> = {
  role: createJobRoleOption,
  level: createJobLevelOption,
  type: createJobTypeOption,
  employmentType: createJobEmploymentTypeOption,
  contractType: createJobContractTypeOption,
  outcome: createJobOutcomeOption
};

const ENTITY_BY_KIND: Record<TaxonomyKind, NotificationEntity> = {
  role: 'jobRole',
  level: 'jobLevel',
  type: 'jobType',
  employmentType: 'jobEmploymentType',
  contractType: 'jobContractType',
  outcome: 'jobOutcome'
};

export function useTaxonomyLists() {
  const state = useTaxonomyStore((store) => store.taxonomy);
  const ensureLoaded = useTaxonomyStore((store) => store.ensureLoaded);
  const reloadTaxonomy = useTaxonomyStore((store) => store.reloadTaxonomy);
  const setTaxonomyOptions = useTaxonomyStore(
    (store) => store.setTaxonomyOptions
  );

  useEffect(() => {
    ensureLoaded();
  }, [ensureLoaded]);

  const addValue = useCallback(
    async (kind: TaxonomyKind, value: string) => {
      await CREATE_FNS[kind](value);
      await reloadTaxonomy(kind);
    },
    [reloadTaxonomy]
  );

  const renameValue = useCallback(
    async (kind: TaxonomyKind, id: string, value: string) => {
      await CLIENTS[kind].update(id, value);
      await reloadTaxonomy(kind);
      // The applications list resolves labels from the server, so a rename must
      // invalidate its cache or it would keep showing the old value until reload.
      useJobsStore.getState().invalidateJobs();
    },
    [reloadTaxonomy]
  );

  // Remove and set-default are triggered from rows that have no inline error
  // slot, so their outcome is reported as a toast and never rethrown.
  const removeValue = useCallback(
    async (kind: TaxonomyKind, id: string) => {
      try {
        await CLIENTS[kind].remove(id);
        notifyActionSuccess('deleted', ENTITY_BY_KIND[kind]);
      } catch (error) {
        notifyActionError('deleted', ENTITY_BY_KIND[kind], error);
        return;
      }
      await reloadTaxonomy(kind);
    },
    [reloadTaxonomy]
  );

  const setDefaultValue = useCallback(
    async (kind: TaxonomyKind, id: string) => {
      try {
        await CLIENTS[kind].setDefault(id);
      } catch (error) {
        notifyActionError('updated', ENTITY_BY_KIND[kind], error);
        return;
      }
      await reloadTaxonomy(kind);
    },
    [reloadTaxonomy]
  );

  const reorderValues = useCallback(
    async (kind: TaxonomyKind, orderedIds: string[]) => {
      const current = useTaxonomyStore.getState().taxonomy[kind].options;
      const byId = new Map(current.map((option) => [option.id, option]));
      const reordered = orderedIds
        .map((id) => byId.get(id))
        .filter((option): option is JobTaxonomyOption => option !== undefined)
        .map((option, index) => ({ ...option, sortOrder: index }));

      setTaxonomyOptions(kind, reordered);

      try {
        await CLIENTS[kind].reorder(orderedIds);
      } catch (error) {
        await reloadTaxonomy(kind);
        throw error;
      }
    },
    [reloadTaxonomy, setTaxonomyOptions]
  );

  return {
    state,
    addValue,
    renameValue,
    removeValue,
    setDefaultValue,
    reorderValues
  };
}
