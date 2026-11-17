import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { UpdateJobFieldInput } from '@job-tracker/shared';

import { JobFieldRow } from '@/features/job-fields/components/JobFieldRow';
import {
  JobFieldForm,
  type JobFieldFormValues
} from '@/features/job-fields/components/JobFieldForm';
import type { JobFieldsState } from '@/features/job-fields/use-job-fields';

export function JobFieldsPage({
  state,
  onAdd,
  onUpdate,
  onDelete
}: {
  state: JobFieldsState;
  onAdd: (values: JobFieldFormValues) => Promise<void>;
  onUpdate: (id: string, input: UpdateJobFieldInput) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const { t } = useTranslation('jobFields');
  const [isAdding, setIsAdding] = useState(false);

  return (
    <main className="flex min-h-0 flex-1 flex-col">
      <div className="px-4 pb-4 pt-5 sm:px-7 sm:pb-5 sm:pt-7">
        <h1 className="m-0 font-serif text-3xl font-normal leading-tight tracking-tight text-foreground">
          {t('page.title')}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('page.subtitle')}
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-20 sm:px-7">
        <div className="max-w-3xl overflow-hidden rounded-xl border border-warm-line bg-card">
          {state.error ? (
            <p className="px-5 py-4 text-sm text-destructive">{state.error}</p>
          ) : state.isLoading ? (
            <p className="px-5 py-4 text-sm text-muted-foreground">…</p>
          ) : (
            <>
              {state.definitions.map((definition) => (
                <JobFieldRow
                  key={definition.id}
                  definition={definition}
                  onUpdate={(values) =>
                    onUpdate(definition.id, {
                      label: values.label,
                      required: values.required,
                      options: values.options.length > 0 ? values.options : null
                    })
                  }
                  onDelete={() => onDelete(definition.id)}
                />
              ))}
              {state.definitions.length === 0 && (
                <p className="px-5 py-4 text-sm text-muted-foreground">
                  {t('page.empty')}
                </p>
              )}
            </>
          )}

          <div className="border-t border-warm-line bg-warm-surface-2">
            {isAdding ? (
              <JobFieldForm
                submitLabel={t('form.add')}
                onSubmit={async (values) => {
                  await onAdd(values);
                  setIsAdding(false);
                }}
                onCancel={() => setIsAdding(false)}
              />
            ) : (
              <button
                type="button"
                onClick={() => setIsAdding(true)}
                className="flex w-full items-center gap-2.5 px-5 py-2.5 text-left text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <Plus className="size-3.5" aria-hidden="true" />
                {t('form.addTitle')}
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
