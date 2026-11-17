import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { AdminFeedback } from '@job-tracker/shared';

import { listAdminFeedback } from './admin-feedback-api';

export type AdminFeedbackState = {
  items: AdminFeedback[];
  isLoading: boolean;
  error: string | null;
};

export function useAdminFeedback(): AdminFeedbackState & {
  replace: (item: AdminFeedback) => void;
} {
  const { t } = useTranslation('adminFeedback');
  const [state, setState] = useState<AdminFeedbackState>({
    items: [],
    isLoading: true,
    error: null
  });

  useEffect(() => {
    let cancelled = false;

    listAdminFeedback()
      .then((items) => {
        if (!cancelled) {
          setState({ items, isLoading: false, error: null });
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState({
            items: [],
            isLoading: false,
            error: error instanceof Error ? error.message : t('list.loadFailed')
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [t]);

  const replace = useCallback((updated: AdminFeedback) => {
    setState((current) => ({
      ...current,
      items: current.items.map((item) =>
        item.id === updated.id ? updated : item
      )
    }));
  }, []);

  return { ...state, replace };
}
