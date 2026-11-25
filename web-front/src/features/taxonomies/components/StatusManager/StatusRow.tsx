import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { JobStatusColor, JobStatusOption } from '@job-tracker/shared';

import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { notifyActionError } from '@/lib/notifications';
import { ROW_OPEN_CLASS, rowOpenHandlers } from '@/lib/row-open';
import { cn } from '@/lib/utils';

import {
  resolveAccentHex,
  statusBadgeStyle
} from '@/features/jobs/status-badge-colors';
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
  STATUS_GRID_CLASS
} from '@/features/taxonomies/taxonomy-grid';

import { ColorSwatchPicker } from './ColorSwatchPicker';

export function StatusRow({
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
  onColorChange,
  onToggleTab,
  onDelete,
  onSetDefault
}: {
  option: JobStatusOption;
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
  onColorChange: (color: JobStatusColor) => Promise<void>;
  onToggleTab: (showAsTab: boolean) => Promise<void>;
  onDelete: () => Promise<void>;
  onSetDefault: () => Promise<void>;
}) {
  const { t } = useTranslation('taxonomies');
  const badge = statusBadgeStyle(option.color);
  const [draft, setDraft] = useState(option.value);
  const [isSavingRename, setIsSavingRename] = useState(false);
  // Enter and the blur it causes both reach saveRename; the ref lets one through
  const savingRef = useRef(false);
  const [renameError, setRenameError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const startEditing = () => {
    setDraft(option.value);
    setRenameError(null);
    onEditingChange(true);
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

  // Colour/tab/default edits share one busy flag: they refetch the list, so
  // disabling the row's controls until it settles prevents overlapping writes.
  // None of them has an inline error slot, so a failure is a toast.
  const runBusy = async (action: () => Promise<void>) => {
    setIsBusy(true);
    try {
      await action();
    } catch (error) {
      notifyActionError('updated', 'jobStatus', error);
    } finally {
      setIsBusy(false);
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
        STATUS_GRID_CLASS,
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
                onEditingChange(false);
              }
            }}
          />
        ) : (
          <div className="flex">
            <span className="status-badge max-w-full" style={badge.badge}>
              <span className="status-badge-dot flex-none" style={badge.dot} />
              <span className="truncate">{option.value}</span>
            </span>
          </div>
        )}
        {renameError && (
          <p className="mt-1 text-xs text-destructive">{renameError}</p>
        )}
      </div>

      {/* Wide panels: colour and tab in their own columns */}
      <div className="hidden justify-center @min-[47.5rem]:flex">
        <ColorSwatchPicker
          color={resolveAccentHex(option.color)}
          disabled={isBusy || isEditing}
          onChange={(color) => void runBusy(() => onColorChange(color))}
        />
      </div>
      <div className="hidden justify-center @min-[47.5rem]:flex">
        <Checkbox
          checked={option.showAsTab}
          disabled={isBusy || isEditing}
          onCheckedChange={(next) =>
            void runBusy(() => onToggleTab(next === true))
          }
          aria-label={t('sections.status.tabLabel')}
        />
      </div>

      <UsageCount className="hidden @md:block" count={option.usageCount} />

      <DefaultChip
        isDefault={option.isDefault}
        disabled={isBusy || isEditing}
        onSetDefault={() => void runBusy(onSetDefault)}
        className="hidden @min-[47.5rem]:inline-flex @min-[47.5rem]:min-w-34"
      />

      <RowActions
        value={option.value}
        isEditing={isEditing}
        onEdit={startEditing}
        onDelete={onDelete}
      />

      {/* Narrow panels: colour and tab under the name, the default at the right end */}
      <div className={cn(SECOND_LINE_CLASS, '@min-[47.5rem]:hidden')}>
        <ColorSwatchPicker
          color={resolveAccentHex(option.color)}
          disabled={isBusy || isEditing}
          onChange={(color) => void runBusy(() => onColorChange(color))}
        />
        <label className="flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground">
          <Checkbox
            checked={option.showAsTab}
            disabled={isBusy || isEditing}
            onCheckedChange={(next) =>
              void runBusy(() => onToggleTab(next === true))
            }
            aria-label={t('sections.status.tabLabel')}
          />
          <span aria-hidden="true">{t('sections.status.tabLabel')}</span>
        </label>
        {/* On phones the count and the default take a line of their own */}
        <div className="flex basis-full items-center gap-4 @md:contents">
          <UsageText className="@md:hidden" count={option.usageCount} />
          <DefaultChip
            isDefault={option.isDefault}
            disabled={isBusy || isEditing}
            onSetDefault={() => void runBusy(onSetDefault)}
            className="ml-auto"
          />
        </div>
      </div>
    </div>
  );
}
