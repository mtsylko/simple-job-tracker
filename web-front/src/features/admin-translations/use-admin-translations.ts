import { useCallback, useEffect, useState } from 'react';
import type { TranslationOverride } from '@job-tracker/shared';

import i18n from '@/i18n';
import { listTranslationOverrides } from './admin-translations-api';

export type AdminTranslationsState = {
  overrides: TranslationOverride[];
  isLoading: boolean;
  error: string | null;
};

function sameString(a: TranslationOverride, b: TranslationOverride): boolean {
  return (
    a.language === b.language && a.namespace === b.namespace && a.key === b.key
  );
}

export function useAdminTranslations(): AdminTranslationsState & {
  update: (saved: TranslationOverride[], removedIds: string[]) => void;
} {
  const [state, setState] = useState<AdminTranslationsState>({
    overrides: [],
    isLoading: true,
    error: null
  });

  useEffect(() => {
    let cancelled = false;

    listTranslationOverrides()
      .then((overrides) => {
        if (!cancelled) {
          setState({ overrides, isLoading: false, error: null });
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState({
            overrides: [],
            isLoading: false,
            error:
              error instanceof Error
                ? error.message
                : i18n.t('list.loadFailed', { ns: 'adminTranslations' })
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const update = useCallback(
    (saved: TranslationOverride[], removedIds: string[]) => {
      setState((current) => ({
        ...current,
        overrides: [
          ...current.overrides.filter(
            (item) =>
              !removedIds.includes(item.id) &&
              !saved.some((next) => sameString(next, item))
          ),
          ...saved
        ]
      }));
    },
    []
  );

  return { ...state, update };
}
