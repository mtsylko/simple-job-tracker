import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { notify, notifyActionError } from '@/lib/notifications';

function toastKey(archived: boolean) {
  return archived ? 'list.bulk.archivedToast' : 'list.bulk.restoredToast';
}

/** Archives or restores many jobs in one request and reports the outcome as a toast with an Undo. */
export function useBulkArchiving(
  onSetManyArchived: (ids: string[], archived: boolean) => Promise<number>
) {
  const { t } = useTranslation('jobs');
  const [isBulkArchiving, setIsBulkArchiving] = useState(false);

  // The Undo: the same rows the other way, reported without an Undo of its own
  const undoMany = useCallback(
    (ids: string[], archived: boolean) => {
      void onSetManyArchived(ids, archived)
        .then((count) => notify.success(t(toastKey(archived), { count })))
        .catch((error: unknown) =>
          notifyActionError(archived ? 'archived' : 'restored', 'job', error)
        );
    },
    [onSetManyArchived, t]
  );

  const setManyArchived = useCallback(
    async (ids: string[], archived: boolean): Promise<boolean> => {
      setIsBulkArchiving(true);
      try {
        const count = await onSetManyArchived(ids, archived);
        notify.success(t(toastKey(archived), { count }), {
          undo: () => undoMany(ids, !archived)
        });
        return true;
      } catch (error) {
        notifyActionError(archived ? 'archived' : 'restored', 'job', error);
        return false;
      } finally {
        setIsBulkArchiving(false);
      }
    },
    [onSetManyArchived, t, undoMany]
  );

  return { isBulkArchiving, setManyArchived };
}
