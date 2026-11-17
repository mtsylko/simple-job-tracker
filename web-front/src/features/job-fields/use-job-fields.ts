import { useCallback, useEffect, useState } from 'react';
import type {
  CreateJobFieldInput,
  JobFieldDefinition,
  UpdateJobFieldInput
} from '@job-tracker/shared';

import i18n from '@/i18n';

import {
  createJobField,
  deleteJobField,
  listJobFields,
  updateJobField
} from '@/features/jobs/job-api';
import { invalidateJobFieldDefinitionsCache } from '@/features/jobs/pages/job-form-page/use-job-field-definitions';
import { notifyActionError, notifyActionSuccess } from '@/lib/notifications';

import { activeDefinitions } from './active-definitions';

export type JobFieldsState = {
  definitions: JobFieldDefinition[];
  isLoading: boolean;
  error: string | null;
};

export function useJobFields() {
  const [state, setState] = useState<JobFieldsState>({
    definitions: [],
    isLoading: true,
    error: null
  });

  // `silent` keeps the current rows on screen while a mutation's refetch is in
  // flight, matching the taxonomy page and avoiding a flash to the loader.
  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
    }

    try {
      const definitions = await listJobFields();
      setState({
        definitions: activeDefinitions(definitions),
        isLoading: false,
        error: null
      });
    } catch (error) {
      setState((prev) => ({
        definitions: prev.definitions,
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : i18n.t('page.loadFailed', { ns: 'jobFields' })
      }));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Any change here can alter what the application form renders, so the form's
  // session cache is invalidated on every successful mutation.
  const afterMutation = useCallback(async () => {
    invalidateJobFieldDefinitionsCache();
    await load({ silent: true });
  }, [load]);

  const add = useCallback(
    async (input: CreateJobFieldInput) => {
      await createJobField(input);
      notifyActionSuccess('created', 'jobField');
      await afterMutation();
    },
    [afterMutation]
  );

  const update = useCallback(
    async (id: string, input: UpdateJobFieldInput) => {
      await updateJobField(id, input);
      notifyActionSuccess('updated', 'jobField');
      await afterMutation();
    },
    [afterMutation]
  );

  // Remove is triggered from a row with no inline error slot, so its outcome is a
  // toast and it is never rethrown.
  const remove = useCallback(
    async (id: string) => {
      try {
        await deleteJobField(id);
        notifyActionSuccess('deleted', 'jobField');
      } catch (error) {
        notifyActionError('deleted', 'jobField', error);
        return;
      }
      await afterMutation();
    },
    [afterMutation]
  );

  return { state, add, update, remove, reload: load };
}
