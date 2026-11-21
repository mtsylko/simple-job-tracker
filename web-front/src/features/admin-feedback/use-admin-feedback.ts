import { useCallback, useEffect, useState } from 'react';
import type { AdminFeedback } from '@job-tracker/shared';

import i18n from '@/i18n';
import { listAdminFeedback } from './admin-feedback-api';

export type AdminFeedbackState = {
  items: AdminFeedback[];
  isLoading: boolean;
  error: string | null;
};

export function useAdminFeedback(): AdminFeedbackState & {
  replace: (item: AdminFeedback) => void;
} {
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
            error:
              error instanceof Error
                ? error.message
                : i18n.t('list.loadFailed', { ns: 'adminFeedback' })
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

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
