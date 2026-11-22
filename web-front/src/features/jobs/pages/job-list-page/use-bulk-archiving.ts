import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { notify, notifyActionError } from '@/lib/notifications';

/** Archives or restores many jobs in one request and reports the outcome as a toast. */
export function useBulkArchiving(
  onSetManyArchived: (ids: string[], archived: boolean) => Promise<number>
) {
  const { t } = useTranslation('jobs');
  const [isBulkArchiving, setIsBulkArchiving] = useState(false);

  const setManyArchived = useCallback(
    async (ids: string[], archived: boolean): Promise<boolean> => {
      setIsBulkArchiving(true);
      try {
        const count = await onSetManyArchived(ids, archived);
        notify.success(
          t(archived ? 'list.bulk.archivedToast' : 'list.bulk.restoredToast', {
            count
          })
        );
        return true;
      } catch (error) {
        notifyActionError(archived ? 'archived' : 'restored', 'job', error);
        return false;
      } finally {
        setIsBulkArchiving(false);
      }
    },
    [onSetManyArchived, t]
  );

  return { isBulkArchiving, setManyArchived };
}
