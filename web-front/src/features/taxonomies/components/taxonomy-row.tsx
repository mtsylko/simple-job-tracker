import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { JobTaxonomyOption } from '@job-tracker/shared';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ROW_OPEN_CLASS, rowOpenHandlers } from '@/lib/row-open';
import { cn } from '@/lib/utils';

import { DefaultChip } from '@/features/taxonomies/components/DefaultChip';
import { RowActions } from '@/features/taxonomies/components/RowActions';
import { RowHandle } from '@/features/taxonomies/components/RowHandle';
import {
  UsageCount,
  UsageText
} from '@/features/taxonomies/components/UsageCell';
import {
  OPTION_ROW_CLASS,
  SECOND_LINE_CLASS,
  TAXONOMY_GRID_CLASS
} from '@/features/taxonomies/taxonomy-grid';

export function TaxonomyRow({
  option,
  canMoveUp,
  canMoveDown,
  isDragging,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onMove,
  onRename,
  onDelete,
  onSetDefault
}: {
  option: JobTaxonomyOption;
  canMoveUp: boolean;
  canMoveDown: boolean;
  isDragging: boolean;
  onDragStart: () => void;
  onDragOver: () => void;
  onDrop: () => void;
  onDragEnd: () => void;
  onMove: (delta: -1 | 1) => void;
  onRename: (value: string) => Promise<void>;
  onDelete: () => Promise<void>;
  onSetDefault: () => Promise<void>;
}) {
  const { t } = useTranslation('taxonomies');
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(option.value);
  const [isSavingRename, setIsSavingRename] = useState(false);
  const [renameError, setRenameError] = useState<string | null>(null);
  const [isSettingDefault, setIsSettingDefault] = useState(false);

  const startEditing = () => {
    setDraft(option.value);
    setRenameError(null);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setRenameError(null);
  };

  const saveRename = async () => {
    const value = draft.trim();
    if (!value || value === option.value) {
      setIsEditing(false);
      return;
    }

    setIsSavingRename(true);
    setRenameError(null);
    try {
      await onRename(value);
      setIsEditing(false);
    } catch (error) {
      setRenameError(error instanceof Error ? error.message : t('renameError'));
    } finally {
      setIsSavingRename(false);
    }
  };

  const handleSetDefault = async () => {
    setIsSettingDefault(true);
    try {
      await onSetDefault();
    } finally {
      setIsSettingDefault(false);
    }
  };

  return (
    <div
      draggable={!isEditing}
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = 'move';
        onDragStart();
      }}
      onDragOver={(event) => {
        event.preventDefault();
        onDragOver();
      }}
      onDrop={(event) => {
        event.preventDefault();
        onDrop();
      }}
      onDragEnd={onDragEnd}
      {...(isEditing ? {} : rowOpenHandlers)}
      className={cn(
        OPTION_ROW_CLASS,
        TAXONOMY_GRID_CLASS,
        !isEditing && ROW_OPEN_CLASS,
        isDragging && 'opacity-40'
      )}
    >
      <RowHandle
        value={option.value}
        isEditing={isEditing}
        canMoveUp={canMoveUp}
        canMoveDown={canMoveDown}
        onMove={onMove}
      />

      <div className="min-w-0">
        {isEditing ? (
          <div className="flex items-center gap-1.5">
            <Input
              autoFocus
              aria-label={t('renameLabel', { value: option.value })}
              value={draft}
              disabled={isSavingRename}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  void saveRename();
                }
                if (event.key === 'Escape') {
                  event.preventDefault();
                  cancelEditing();
                }
              }}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => void saveRename()}
              disabled={isSavingRename}
              aria-label={t('save')}
            >
              <Check aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={cancelEditing}
              disabled={isSavingRename}
              aria-label={t('cancel')}
            >
              <X aria-hidden="true" />
            </Button>
          </div>
        ) : (
          <span className="break-words font-medium text-foreground">
            {option.value}
          </span>
        )}
        {renameError && (
          <p className="mt-1 text-xs text-destructive">{renameError}</p>
        )}
      </div>

      <UsageCount className="hidden @md:block" count={option.usageCount} />

      <DefaultChip
        isDefault={option.isDefault}
        disabled={isSettingDefault || isEditing}
        onSetDefault={() => void handleSetDefault()}
        className="hidden @xl:inline-flex @xl:min-w-34"
      />

      <RowActions
        value={option.value}
        isEditing={isEditing}
        onEdit={startEditing}
        onDelete={onDelete}
      />

      {/* Narrow panels: the default on a second line, at the row's right end */}
      <div className={cn(SECOND_LINE_CLASS, '@xl:hidden')}>
        <UsageText className="@md:hidden" count={option.usageCount} />
        <DefaultChip
          className="ml-auto"
          isDefault={option.isDefault}
          disabled={isSettingDefault || isEditing}
          onSetDefault={() => void handleSetDefault()}
        />
      </div>
    </div>
  );
}
