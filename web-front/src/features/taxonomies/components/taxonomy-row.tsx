import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { JobTaxonomyOption } from '@job-tracker/shared';

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
  isEditing,
  onEditingChange,
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
  /** Held by the list, so one rename is open at a time. */
  isEditing: boolean;
  onEditingChange: (open: boolean) => void;
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
  const [draft, setDraft] = useState(option.value);
  const [isSavingRename, setIsSavingRename] = useState(false);
  // Enter and the blur it causes both reach saveRename; the ref lets one through
  const savingRef = useRef(false);
  const [renameError, setRenameError] = useState<string | null>(null);
  const [isSettingDefault, setIsSettingDefault] = useState(false);

  const startEditing = () => {
    setDraft(option.value);
    setRenameError(null);
    onEditingChange(true);
  };

  const cancelEditing = () => {
    onEditingChange(false);
    setRenameError(null);
  };

  const saveRename = async () => {
    if (savingRef.current) return;

    const value = draft.trim();
    if (!value || value === option.value) {
      onEditingChange(false);
      return;
    }

    savingRef.current = true;
    setIsSavingRename(true);
    setRenameError(null);
    try {
      await onRename(value);
      onEditingChange(false);
    } catch (error) {
      setRenameError(error instanceof Error ? error.message : t('renameError'));
    } finally {
      savingRef.current = false;
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
          // Enter and leaving the field save, Escape cancels: no buttons, as a rename in place works everywhere
          <Input
            autoFocus
            aria-label={t('renameLabel', { value: option.value })}
            value={draft}
            disabled={isSavingRename}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={() => void saveRename()}
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
