import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { AdminUserSummary } from '@job-tracker/shared';

import { AdminUsersPage } from '@/features/admin-users/pages/AdminUsersPage';
import { useAdminUsers } from '@/features/admin-users/use-admin-users';
import { openAccount } from '@/features/admin-users/view-account';
import { notify } from '@/lib/notifications';

export function AdminUsersRoute() {
  const { t } = useTranslation('adminUsers');
  const state = useAdminUsers();
  const [openingId, setOpeningId] = useState<string | null>(null);

  // Success navigates away, so only a failure needs to clear the pending row.
  const open = async (user: AdminUserSummary) => {
    setOpeningId(user.id);
    try {
      await openAccount(user.id);
    } catch (error) {
      setOpeningId(null);
      notify.error(
        t('viewAs.openFailed'),
        error instanceof Error ? error.message : undefined
      );
    }
  };

  return (
    <AdminUsersPage
      state={state}
      openingId={openingId}
      onOpen={(user) => void open(user)}
    />
  );
}
