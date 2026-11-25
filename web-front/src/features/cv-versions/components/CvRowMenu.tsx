import {
  Archive,
  ArchiveRestore,
  Download,
  Eye,
  MoreHorizontal,
  Pencil,
  Trash2
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import type { CvVersionRow } from '@/features/cv-versions/types';
import { cn } from '@/lib/utils';

/**
 * The row's actions: the PDF preview stays a visible button, since reading the
 * CV is what a row is mostly for; the rest sit in one menu, as in the
 * applications table.
 */
export function CvRowMenu({
  cv,
  disabled,
  onEdit,
  onPreview,
  onDownload,
  onToggleArchive,
  onDelete,
  triggerClassName
}: {
  cv: CvVersionRow;
  disabled?: boolean;
  onEdit: (id: string) => void;
  onPreview: (id: string) => void;
  onDownload: (attachment: string) => void;
  /** Archives or restores the version, which is what enabled means in the CV picker. */
  onToggleArchive: (cv: CvVersionRow) => void;
  onDelete: (id: string) => void;
  triggerClassName?: string;
}) {
  const { t } = useTranslation('cvVersions');
  const hasAttachment = cv.attachment.trim().length > 0;

  return (
    <div className="flex h-full items-center justify-end gap-2">
      {/* In every row, disabled where there is no file, so the column reads the same down the table */}
      <Button
        type="button"
        variant="ghost"
        size="icon-lg"
        className={cn('text-muted-foreground', triggerClassName)}
        aria-label={t('viewer.preview')}
        title={t('viewer.preview')}
        disabled={!hasAttachment}
        onClick={() => onPreview(cv.id)}
      >
        <Eye aria-hidden="true" />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger
          // Borderless at rest, as in the applications table
          className={cn(
            'size-8 border-transparent text-muted-foreground hover:text-foreground dark:bg-transparent',
            triggerClassName
          )}
          aria-label={t('list.menu.actions', { name: cv.name })}
          disabled={disabled}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 32px to click, as the other row controls; the primitive defaults to 24 */}
          <MoreHorizontal className="size-4" aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem className="gap-2" onClick={() => onEdit(cv.id)}>
            <Pencil className="size-3.5" aria-hidden="true" />
            {t('list.menu.edit')}
          </DropdownMenuItem>
          <DropdownMenuItem
            className="gap-2"
            onClick={() => onToggleArchive(cv)}
          >
            {cv.enabled ? (
              <Archive className="size-3.5" aria-hidden="true" />
            ) : (
              <ArchiveRestore className="size-3.5" aria-hidden="true" />
            )}
            {t(cv.enabled ? 'list.menu.archive' : 'list.menu.restore')}
          </DropdownMenuItem>
          <DropdownMenuItem
            className="gap-2"
            disabled={!hasAttachment}
            onClick={() => onDownload(cv.attachment)}
          >
            <Download className="size-3.5" aria-hidden="true" />
            {t('viewer.download')}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="gap-2 text-destructive"
            onClick={() => onDelete(cv.id)}
          >
            <Trash2 className="size-3.5" aria-hidden="true" />
            {t('list.menu.delete')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
