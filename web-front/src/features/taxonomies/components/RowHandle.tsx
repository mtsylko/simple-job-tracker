import { ArrowDown, ArrowUp, GripVertical } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

/** The drag grip; its menu, Move up and Move down, is what the keyboard and touch screens get instead. */
export function RowHandle({
  value,
  isEditing,
  canMoveUp,
  canMoveDown,
  onMove
}: {
  value: string;
  isEditing: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMove: (delta: -1 | 1) => void;
}) {
  const { t } = useTranslation('taxonomies');

  return (
    <div className="relative grid place-items-center">
      <GripVertical
        className={cn(
          'size-3.5 text-muted-foreground/60 pointer-coarse:hidden',
          isEditing ? 'cursor-default' : 'cursor-grab'
        )}
        aria-hidden="true"
      />
      <DropdownMenu>
        <DropdownMenuTrigger
          // Under the grip and out of the mouse's way, since the mouse drags; it appears for the keyboard and stands in for the grip on touch screens
          className="pointer-events-none absolute inset-0 m-auto size-8 border-transparent text-muted-foreground opacity-0 focus-visible:opacity-100 data-popup-open:opacity-100 pointer-coarse:static pointer-coarse:pointer-events-auto pointer-coarse:opacity-100 dark:bg-transparent"
          aria-label={t('menu.move', { value })}
          disabled={isEditing}
        >
          <GripVertical className="size-3.5" aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuItem
            className="gap-2"
            disabled={!canMoveUp}
            onClick={() => onMove(-1)}
          >
            <ArrowUp className="size-3.5" aria-hidden="true" />
            {t('menu.moveUp')}
          </DropdownMenuItem>
          <DropdownMenuItem
            className="gap-2"
            disabled={!canMoveDown}
            onClick={() => onMove(1)}
          >
            <ArrowDown className="size-3.5" aria-hidden="true" />
            {t('menu.moveDown')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
