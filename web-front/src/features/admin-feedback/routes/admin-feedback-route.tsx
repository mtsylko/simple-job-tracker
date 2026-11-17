import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { AdminFeedback } from '@job-tracker/shared';

import { updateAdminFeedback } from '@/features/admin-feedback/admin-feedback-api';
import { AdminFeedbackPage } from '@/features/admin-feedback/pages/AdminFeedbackPage';
import { useAdminFeedback } from '@/features/admin-feedback/use-admin-feedback';
import { notify } from '@/lib/notifications';

export function AdminFeedbackRoute() {
  const { t } = useTranslation('adminFeedback');
  const { replace, ...state } = useAdminFeedback();
  // A set, so one toggle finishing does not re-enable another still in flight.
  const [pendingIds, setPendingIds] = useState<ReadonlySet<string>>(
    () => new Set()
  );

  const setPending = (id: string, isPending: boolean) => {
    setPendingIds((current) => {
      const next = new Set(current);
      if (isPending) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const toggleResolved = async (item: AdminFeedback) => {
    setPending(item.id, true);
    try {
      replace(
        await updateAdminFeedback(item.id, {
          resolved: item.resolvedAt === null
        })
      );
    } catch (error) {
      notify.error(
        t('item.updateFailed'),
        error instanceof Error ? error.message : undefined
      );
    } finally {
      setPending(item.id, false);
    }
  };

  return (
    <AdminFeedbackPage
      state={state}
      pendingIds={pendingIds}
      onToggleResolved={(item) => void toggleResolved(item)}
    />
  );
}
