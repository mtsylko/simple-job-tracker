import { ArrowDown, ArrowUp, GripVertical } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

/** The drag grip; on touch screens it opens Move up and Move down instead. */
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
    <div className="grid place-items-center">
      <GripVertical
        className={cn(
          'size-3.5 text-muted-foreground/60 pointer-coarse:hidden',
          isEditing ? 'cursor-default' : 'cursor-grab'
        )}
        aria-hidden="true"
      />
      <DropdownMenu>
        <DropdownMenuTrigger
          className="hidden size-8 border-transparent text-muted-foreground pointer-coarse:inline-flex dark:bg-transparent"
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
