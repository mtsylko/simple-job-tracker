import {
  Archive,
  ArchiveRestore,
  Ban,
  MoreHorizontal,
  Pencil,
  Trash2
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { isArchived, type JobRow } from '@/features/jobs/types.ts';
import { cn } from '@/lib/utils';

/**
 * One menu instead of three icon buttons. Each action gets a readable name,
 * and the column stays narrow.
 */
export function RowMenu({
  row,
  disabled,
  onEdit,
  onToggleArchive,
  onBlacklistCompany,
  onDelete,
  triggerClassName
}: {
  row: JobRow;
  disabled: boolean;
  onEdit: (id: string) => void;
  onToggleArchive: (row: JobRow) => void;
  onBlacklistCompany: (row: JobRow) => void;
  onDelete: (row: JobRow) => void;
  triggerClassName?: string;
}) {
  const { t } = useTranslation('jobs');
  const archived = isArchived(row);
  const canBlacklist = row.company.trim().length > 0;

  return (
    <div className="flex h-full items-center justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger
          // Borderless at rest: an outlined box on every row was the loudest mark in the list.
          className={cn(
            'size-8 border-transparent text-muted-foreground hover:text-foreground dark:bg-transparent',
            triggerClassName
          )}
          aria-label={t('list.table.rowMenu', { company: row.company })}
          disabled={disabled}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 32px to click, as the other row controls; the primitive defaults to 24 */}
          <MoreHorizontal className="size-4" aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem className="gap-2" onClick={() => onEdit(row.id)}>
            <Pencil className="size-3.5" aria-hidden="true" />
            {t('list.table.menuEdit')}
          </DropdownMenuItem>
          <DropdownMenuItem
            className="gap-2"
            onClick={() => onToggleArchive(row)}
          >
            {archived ? (
              <ArchiveRestore className="size-3.5" aria-hidden="true" />
            ) : (
              <Archive className="size-3.5" aria-hidden="true" />
            )}
            {t(
              archived ? 'list.table.menuUnarchive' : 'list.table.menuArchive'
            )}
          </DropdownMenuItem>
          {canBlacklist && (
            <DropdownMenuItem
              className="gap-2"
              onClick={() => onBlacklistCompany(row)}
            >
              <Ban className="size-3.5" aria-hidden="true" />
              {t('list.table.menuBlacklist')}
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="gap-2 text-destructive"
            onClick={() => onDelete(row)}
          >
            <Trash2 className="size-3.5" aria-hidden="true" />
            {t('list.table.menuDelete')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
