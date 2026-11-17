import type { JobStatusColor } from '@job-tracker/shared';
import { useTranslation } from 'react-i18next';

import { CategoryPanel } from '@/features/taxonomies/components/CategoryPanel';
import { DefaultChipSpacer } from '@/features/taxonomies/components/DefaultChip';
import { STATUS_GRID_CLASS } from '@/features/taxonomies/taxonomy-grid';
import { useDragReorder } from '@/hooks/use-drag-reorder';
import type { StatusListState } from '@/features/taxonomies/use-status-list';

import { StatusRow } from './StatusRow';

export function StatusManagerSection({
  state,
  onRename,
  onColorChange,
  onToggleTab,
  onDelete,
  onSetDefault,
  onReorder
}: {
  state: StatusListState;
  onRename: (id: string, value: string) => Promise<void>;
  onColorChange: (id: string, color: JobStatusColor) => Promise<void>;
  onToggleTab: (id: string, showAsTab: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onSetDefault: (id: string) => Promise<void>;
  onReorder: (orderedIds: string[]) => Promise<void>;
}) {
  const { t } = useTranslation('taxonomies');
  const { moveBy, isDragging, getRowDragHandlers } = useDragReorder(
    state.options,
    onReorder
  );
  const lastIndex = state.options.length - 1;

  return (
    <CategoryPanel
      columnsClassName={STATUS_GRID_CLASS}
      columnLabels={
        <>
          <span />
          <span>{t('columns.name')}</span>
          <span className="hidden text-center @min-[47.5rem]:block">
            {t('sections.status.colorLabel')}
          </span>
          <span className="hidden text-center whitespace-nowrap @min-[47.5rem]:block">
            {t('columns.tab')}
          </span>
          <span className="text-center whitespace-nowrap">
            {t('columns.applications')}
          </span>
          <DefaultChipSpacer className="hidden @min-[47.5rem]:inline-flex @min-[47.5rem]:min-w-34" />
          <span />
        </>
      }
      labelsClassName="hidden @md:grid"
      isLoading={state.isLoading && state.options.length === 0}
      error={state.error}
      isEmpty={state.options.length === 0}
    >
      {state.options.map((option, index) => (
        <StatusRow
          key={option.id}
          option={option}
          canMoveUp={index > 0}
          canMoveDown={index < lastIndex}
          isDragging={isDragging(option.id)}
          {...getRowDragHandlers(option.id)}
          onMove={(delta) => moveBy(option.id, delta)}
          onRename={(value) => onRename(option.id, value)}
          onColorChange={(color) => onColorChange(option.id, color)}
          onToggleTab={(showAsTab) => onToggleTab(option.id, showAsTab)}
          onDelete={() => onDelete(option.id)}
          onSetDefault={() => onSetDefault(option.id)}
        />
      ))}
    </CategoryPanel>
  );
}
