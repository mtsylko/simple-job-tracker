import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type {
  CreateJobStatusOptionInput,
  JobStatusColor
} from '@job-tracker/shared';

import {
  CATEGORY_KIND_BY_SLUG,
  type CategorySlug
} from '@/features/taxonomies/categories';
import { Button } from '@/components/ui/button';
import { AddOptionDialog } from '@/features/taxonomies/components/AddOptionDialog';
import { TaxonomySection } from '@/features/taxonomies/components/taxonomy-section';
import { StatusManagerSection } from '@/features/taxonomies/components/StatusManager/StatusManagerSection';
import type {
  TaxonomyKind,
  TaxonomyListState
} from '@/features/taxonomies/use-taxonomy-lists';
import type { StatusListState } from '@/features/taxonomies/use-status-list';

export function TaxonomiesPage({
  slug,
  state,
  onAdd,
  onRename,
  onDelete,
  onSetDefault,
  onReorder,
  statusState,
  onStatusAdd,
  onStatusRename,
  onStatusColorChange,
  onStatusToggleTab,
  onStatusDelete,
  onStatusSetDefault,
  onStatusReorder
}: {
  slug: CategorySlug;
  state: Record<TaxonomyKind, TaxonomyListState>;
  onAdd: (kind: TaxonomyKind, value: string) => Promise<void>;
  onRename: (kind: TaxonomyKind, id: string, value: string) => Promise<void>;
  onDelete: (kind: TaxonomyKind, id: string) => Promise<void>;
  onSetDefault: (kind: TaxonomyKind, id: string) => Promise<void>;
  onReorder: (kind: TaxonomyKind, orderedIds: string[]) => Promise<void>;
  statusState: StatusListState;
  onStatusAdd: (input: CreateJobStatusOptionInput) => Promise<void>;
  onStatusRename: (id: string, value: string) => Promise<void>;
  onStatusColorChange: (id: string, color: JobStatusColor) => Promise<void>;
  onStatusToggleTab: (id: string, showAsTab: boolean) => Promise<void>;
  onStatusDelete: (id: string) => Promise<void>;
  onStatusSetDefault: (id: string) => Promise<void>;
  onStatusReorder: (orderedIds: string[]) => Promise<void>;
}) {
  const { t } = useTranslation('taxonomies');
  const kind = CATEGORY_KIND_BY_SLUG[slug];
  const [isAddOpen, setIsAddOpen] = useState(false);
  const options = kind === 'status' ? statusState.options : state[kind].options;

  return (
    <main className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-20 pt-5 sm:px-7 sm:pt-7">
        {/* As wide as Custom fields: a short list keeps its figures near its names */}
        <div className="max-w-3xl">
          {/* The same row as on Applications: the title, its actions on its right */}
          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
            <h1 className="m-0 font-serif text-3xl font-normal leading-display tracking-tight text-foreground">
              {t(`sections.${kind}.title`)}
            </h1>
            <Button
              size="lg"
              className="shrink-0 gap-1.5"
              onClick={() => setIsAddOpen(true)}
            >
              <Plus className="size-3.5" aria-hidden="true" />
              {t('common:form.addNew')}
            </Button>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {t(`sections.${kind}.description`)}
          </p>

          <div className="mt-5 sm:mt-6">
            {kind === 'status' ? (
              <StatusManagerSection
                state={statusState}
                onRename={onStatusRename}
                onColorChange={onStatusColorChange}
                onToggleTab={onStatusToggleTab}
                onDelete={onStatusDelete}
                onSetDefault={onStatusSetDefault}
                onReorder={onStatusReorder}
              />
            ) : (
              <TaxonomySection
                // Fresh rows per list, so an open rename never carries over.
                key={kind}
                state={state[kind]}
                onRename={(id, value) => onRename(kind, id, value)}
                onDelete={(id) => onDelete(kind, id)}
                onSetDefault={(id) => onSetDefault(kind, id)}
                onReorder={(orderedIds) => onReorder(kind, orderedIds)}
              />
            )}
          </div>
        </div>
      </div>

      <AddOptionDialog
        // A fresh form per list, so a half-typed value never carries over.
        key={kind}
        open={isAddOpen}
        title={t(`sections.${kind}.addLabel`)}
        placeholder={t(`sections.${kind}.addPlaceholder`)}
        existingValues={options.map((option) => option.value)}
        withColor={kind === 'status'}
        onAdd={(value, color) =>
          kind === 'status'
            ? onStatusAdd({ value, color, showAsTab: false })
            : onAdd(kind, value)
        }
        onClose={() => setIsAddOpen(false)}
      />
    </main>
  );
}
