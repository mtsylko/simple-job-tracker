import { Archive, ArchiveRestore, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';

/**
 * Floats over the foot of the table while rows are selected, so showing it
 * never shifts the list. Each action counts only the rows it would change.
 */
export function BulkActionBar({
  selectedCount,
  archivableCount,
  restorableCount,
  isPending,
  onArchive,
  onRestore,
  onClear
}: {
  selectedCount: number;
  archivableCount: number;
  restorableCount: number;
  isPending: boolean;
  onArchive: () => void;
  onRestore: () => void;
  onClear: () => void;
}) {
  const { t } = useTranslation('jobs');

  // Same surface as the app's popovers and menus
  return (
    <div
      role="toolbar"
      aria-label={t('list.bulk.toolbar')}
      className="absolute bottom-8 left-1/2 z-40 flex -translate-x-1/2 items-center gap-1.5 rounded-lg bg-popover p-1.5 text-popover-foreground shadow-md ring-1 ring-foreground/10"
    >
      <span className="num px-2 text-sm font-medium whitespace-nowrap">
        {t('list.bulk.selected', { count: selectedCount })}
      </span>

      {archivableCount > 0 && (
        <Button
          type="button"
          className="gap-1.5"
          disabled={isPending}
          onClick={onArchive}
        >
          <Archive className="size-3.5" aria-hidden="true" />
          {t('list.bulk.archive')}
        </Button>
      )}

      {restorableCount > 0 && (
        <Button
          type="button"
          variant="outline"
          className="gap-1.5"
          disabled={isPending}
          onClick={onRestore}
        >
          <ArchiveRestore className="size-3.5" aria-hidden="true" />
          {t('list.bulk.restore')}
        </Button>
      )}

      <Button
        type="button"
        size="icon"
        variant="ghost"
        aria-label={t('list.bulk.clear')}
        disabled={isPending}
        onClick={onClear}
      >
        <X aria-hidden="true" />
      </Button>
    </div>
  );
}
