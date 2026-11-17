import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { TranslationOverride } from '@job-tracker/shared';

import { LANGUAGES, type Language } from '@/app/language';
import {
  deleteTranslationOverride,
  saveTranslationOverride
} from '@/features/admin-translations/admin-translations-api';
import { AdminTranslationsPage } from '@/features/admin-translations/pages/AdminTranslationsPage';
import type { TranslationRow } from '@/features/admin-translations/translation-catalog';
import { useAdminTranslations } from '@/features/admin-translations/use-admin-translations';
import { notify } from '@/lib/notifications';
import { applyTranslationOverride } from '@/lib/translation-overrides';

type Change =
  | { kind: 'saved'; override: TranslationOverride }
  | { kind: 'removed'; override: TranslationOverride };

function firstFailure(
  results: PromiseSettledResult<unknown>[]
): string | undefined | null {
  const failure = results.find(
    (result): result is PromiseRejectedResult => result.status === 'rejected'
  );
  if (!failure) return null;
  return failure.reason instanceof Error ? failure.reason.message : undefined;
}

export function AdminTranslationsRoute() {
  const { t } = useTranslation('adminTranslations');
  const { update, ...state } = useAdminTranslations();

  const commit = useCallback(
    (results: PromiseSettledResult<Change>[]) => {
      const saved: TranslationOverride[] = [];
      const removedIds: string[] = [];

      for (const result of results) {
        if (result.status !== 'fulfilled') continue;
        const { kind, override } = result.value;
        // The admin sees the new copy across the app at once, not after a reload.
        applyTranslationOverride(
          override.language,
          override.namespace,
          override.key,
          kind === 'saved' ? override.value : null
        );
        if (kind === 'saved') saved.push(override);
        else removedIds.push(override.id);
      }

      update(saved, removedIds);
    },
    [update]
  );

  const save = useCallback(
    async (
      row: TranslationRow,
      values: Partial<Record<Language, string>>
    ): Promise<boolean> => {
      const tasks: Promise<Change>[] = [];

      for (const language of LANGUAGES) {
        const shipped = row.defaults[language];
        const value = values[language];
        const existing = row.overrides[language];
        if (shipped === undefined || value === undefined) continue;

        // Typing the shipped text back in is the same as resetting it.
        if (value === shipped) {
          if (existing) {
            tasks.push(
              deleteTranslationOverride(existing.id).then(() => ({
                kind: 'removed',
                override: existing
              }))
            );
          }
        } else if (value !== existing?.value) {
          tasks.push(
            saveTranslationOverride({
              language,
              namespace: row.namespace,
              key: row.key,
              value
            }).then((override) => ({ kind: 'saved', override }))
          );
        }
      }

      const results = await Promise.allSettled(tasks);
      commit(results);

      const failure = firstFailure(results);
      if (failure !== null) {
        notify.error(t('edit.saveFailed'), failure);
        return false;
      }
      notify.success(t('edit.saved'));
      return true;
    },
    [commit, t]
  );

  const removeOrphans = useCallback(
    async (orphans: TranslationOverride[]): Promise<boolean> => {
      const results = await Promise.allSettled(
        orphans.map((override) =>
          deleteTranslationOverride(override.id).then(
            (): Change => ({ kind: 'removed', override })
          )
        )
      );
      commit(results);

      const failure = firstFailure(results);
      if (failure !== null) {
        notify.error(t('orphans.removeFailed'), failure);
        return false;
      }
      return true;
    },
    [commit, t]
  );

  return (
    <AdminTranslationsPage
      state={state}
      onSave={save}
      onRemoveOrphans={removeOrphans}
    />
  );
}
