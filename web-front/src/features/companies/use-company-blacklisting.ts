import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { blacklistCompany } from '@/features/companies/companies-api';
import { useBlacklistStore } from '@/features/companies/blacklist-store';
import { ApiError } from '@/lib/api-client';
import { notify } from '@/lib/notifications';

/**
 * Blacklisting a company from a row action. The action only opens a
 * confirmation; the company is blacklisted on confirm. One already on the list
 * (409) is reported as info, not an error — the intent is satisfied either way.
 */
export function useCompanyBlacklisting(onBlacklisted?: () => void) {
  const { t } = useTranslation('companies');
  const ensureLoaded = useBlacklistStore((store) => store.ensureLoaded);
  const [companyPendingBlacklist, setCompanyPendingBlacklist] = useState<
    string | null
  >(null);
  const [isBlacklisting, setIsBlacklisting] = useState(false);

  // Warm the blacklist so the applications list can mark matching companies on first paint.
  useEffect(() => {
    ensureLoaded();
  }, [ensureLoaded]);

  const requestBlacklist = useCallback((company: string) => {
    const trimmed = company.trim();
    if (!trimmed) {
      return;
    }
    setCompanyPendingBlacklist(trimmed);
  }, []);

  const cancelBlacklist = useCallback(() => {
    setCompanyPendingBlacklist(null);
  }, []);

  // Reason is passed in rather than held in this hook's state: the hook is used
  // by JobListPage, and state living there would re-render the whole page (and
  // its heavy table) on every keystroke in the reason field.
  const confirmBlacklist = useCallback(
    async (reason: string) => {
      if (!companyPendingBlacklist) {
        return;
      }
      const company = companyPendingBlacklist;

      setIsBlacklisting(true);
      try {
        await blacklistCompany({ company, reason: reason.trim() || null });
        void useBlacklistStore.getState().reload();
        onBlacklisted?.();
        notify.success(t('blacklist.added', { company }));
        setCompanyPendingBlacklist(null);
      } catch (error) {
        if (error instanceof ApiError && error.status === 409) {
          notify.info(t('blacklist.already', { company }));
          setCompanyPendingBlacklist(null);
          return;
        }
        // Keep the dialog open so the user can retry after the error toast.
        notify.error(
          t('blacklist.failed', { company }),
          error instanceof Error ? error.message : undefined
        );
      } finally {
        setIsBlacklisting(false);
      }
    },
    [companyPendingBlacklist, onBlacklisted, t]
  );

  return {
    companyPendingBlacklist,
    isBlacklisting,
    requestBlacklist,
    cancelBlacklist,
    confirmBlacklist
  };
}
