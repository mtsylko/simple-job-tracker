import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { CategoryPanel } from '@/features/taxonomies/components/CategoryPanel';
import { DefaultChipSpacer } from '@/features/taxonomies/components/DefaultChip';
import { TaxonomyRow } from '@/features/taxonomies/components/taxonomy-row';
import { TAXONOMY_GRID_CLASS } from '@/features/taxonomies/taxonomy-grid';
import type { TaxonomyListState } from '@/features/taxonomies/use-taxonomy-lists';
import { useDragReorder } from '@/hooks/use-drag-reorder';

export function TaxonomySection({
  state,
  onRename,
  onDelete,
  onSetDefault,
  onReorder
}: {
  state: TaxonomyListState;
  onRename: (id: string, value: string) => Promise<void>;
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
  // One rename at a time: opening another row's closes this one
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <CategoryPanel
      columnsClassName={TAXONOMY_GRID_CLASS}
      columnLabels={
        <>
          <span />
          <span>{t('columns.name')}</span>
          <span className="text-center whitespace-nowrap">
            {t('columns.applications')}
          </span>
          <DefaultChipSpacer className="hidden @xl:inline-flex @xl:min-w-34" />
          <span />
        </>
      }
      labelsClassName="hidden @md:grid"
      isLoading={state.isLoading && state.options.length === 0}
      error={state.error}
      isEmpty={state.options.length === 0}
    >
      {state.options.map((option, index) => (
        <TaxonomyRow
          key={option.id}
          option={option}
          isEditing={editingId === option.id}
          onEditingChange={(open) =>
            setEditingId((current) =>
              open ? option.id : current === option.id ? null : current
            )
          }
          canMoveUp={index > 0}
          canMoveDown={index < lastIndex}
          isDragging={isDragging(option.id)}
          {...getRowDragHandlers(option.id)}
          onMove={(delta) => moveBy(option.id, delta)}
          onRename={(value) => onRename(option.id, value)}
          onDelete={() => onDelete(option.id)}
          onSetDefault={() => onSetDefault(option.id)}
        />
      ))}
    </CategoryPanel>
  );
}
