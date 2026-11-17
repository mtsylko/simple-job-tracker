import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { AdminUserSummary } from '@job-tracker/shared';

import { listAdminUsers } from './admin-users-api';

export type AdminUsersState = {
  users: AdminUserSummary[];
  isLoading: boolean;
  error: string | null;
};

export function useAdminUsers(): AdminUsersState {
  const { t } = useTranslation('adminUsers');
  const [state, setState] = useState<AdminUsersState>({
    users: [],
    isLoading: true,
    error: null
  });

  useEffect(() => {
    let cancelled = false;

    listAdminUsers()
      .then((users) => {
        if (!cancelled) {
          setState({ users, isLoading: false, error: null });
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState({
            users: [],
            isLoading: false,
            error: error instanceof Error ? error.message : t('list.loadFailed')
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [t]);

  return state;
}
