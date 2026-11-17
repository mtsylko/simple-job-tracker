import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { CompanySummary } from '@job-tracker/shared';

import i18n from '@/i18n';
import { notify } from '@/lib/notifications';

import {
  blacklistCompany,
  listCompanies,
  unblacklistCompany,
  updateBlacklistReason
} from './companies-api';
import { useBlacklistStore } from './blacklist-store';

export type CompaniesState = {
  companies: CompanySummary[];
  isLoading: boolean;
  error: string | null;
};

export function useCompanies() {
  const { t } = useTranslation('companies');
  const [state, setState] = useState<CompaniesState>({
    companies: [],
    isLoading: true,
    error: null
  });

  // `silent` keeps the current rows on screen while a mutation's refetch is in
  // flight, matching the taxonomy and custom-fields pages.
  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
    }

    try {
      const companies = await listCompanies();
      setState({ companies, isLoading: false, error: null });
    } catch (error) {
      setState((prev) => ({
        companies: prev.companies,
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : i18n.t('page.loadFailed', { ns: 'companies' })
      }));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const afterMutation = useCallback(async () => {
    void useBlacklistStore.getState().reload();
    await load({ silent: true });
  }, [load]);

  // Add surfaces its failure to the caller (an inline form error) rather than a
  // toast, so a duplicate company can be corrected in place.
  const addToBlacklist = useCallback(
    async (company: string, reason: string | null) => {
      await blacklistCompany({ company, reason });
      notify.success(t('blacklist.added', { company }));
      await afterMutation();
    },
    [afterMutation, t]
  );

  const updateReason = useCallback(
    async (id: string, reason: string | null) => {
      await updateBlacklistReason(id, reason);
      notify.success(t('blacklist.reasonSaved'));
      await afterMutation();
    },
    [afterMutation, t]
  );

  // Remove is triggered from a row with no inline error slot, so its outcome is a
  // toast and it is never rethrown.
  const removeFromBlacklist = useCallback(
    async (company: CompanySummary) => {
      if (!company.id) {
        return;
      }
      try {
        await unblacklistCompany(company.id);
        notify.success(t('blacklist.removed', { company: company.name }));
      } catch (error) {
        notify.error(
          t('blacklist.removeFailed', { company: company.name }),
          error instanceof Error ? error.message : undefined
        );
        return;
      }
      await afterMutation();
    },
    [afterMutation, t]
  );

  return {
    state,
    addToBlacklist,
    updateReason,
    removeFromBlacklist,
    reload: load
  };
}
