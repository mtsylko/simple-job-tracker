import { useEffect, useState } from 'react';
import type { AdminUserSummary } from '@job-tracker/shared';

import i18n from '@/i18n';
import { listAdminUsers } from './admin-users-api';

export type AdminUsersState = {
  users: AdminUserSummary[];
  isLoading: boolean;
  error: string | null;
};

export function useAdminUsers(): AdminUsersState {
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
            error:
              error instanceof Error
                ? error.message
                : i18n.t('list.loadFailed', { ns: 'adminUsers' })
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
