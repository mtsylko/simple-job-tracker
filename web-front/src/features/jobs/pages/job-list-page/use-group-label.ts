import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Turns a raw grouping value into the label the group header shows.
 *
 * Every grouped column — outcome, status, role, level, type, cv — is now a
 * user-authored value, so it is already its own label; only company and empty
 * values need special copy.
 */
export function useGroupLabel() {
  const { t } = useTranslation('jobs');

  return useCallback(
    (columnId: string, value: unknown): string => {
      const raw = String(value ?? '').trim();

      if (columnId === 'company') return raw || t('list.table.noCompany');
      if (!raw) return t('list.table.groupNoValue');
      return raw;
    },
    [t]
  );
}
