import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { JobFieldDefinition } from '@job-tracker/shared';

import { Modal } from '@/components/Modal';
import { Button } from '@/components/ui/button';
import { ROW_OPEN_CLASS, ROW_OPENER, rowOpenHandlers } from '@/lib/row-open';
import { cn } from '@/lib/utils';

import { JobFieldForm, type JobFieldFormValues } from './JobFieldForm';

export function JobFieldRow({
  definition,
  isEditing,
  onEditingChange,
  onUpdate,
  onDelete
}: {
  definition: JobFieldDefinition;
  /** Held by the page, so one form (add or edit) is open at a time. */
  isEditing: boolean;
  onEditingChange: (open: boolean) => void;
  onUpdate: (values: JobFieldFormValues) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const { t } = useTranslation('jobFields');
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete();
      setIsDeleteOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isEditing) {
    return (
      <div className="border-b border-warm-line bg-warm-surface-2">
        <JobFieldForm
          initialValues={{
            label: definition.label,
            type: definition.type,
            required: definition.required,
            options: definition.options ?? []
          }}
          lockType
          submitLabel={t('form.save')}
          onSubmit={async (values) => {
            await onUpdate(values);
            onEditingChange(false);
          }}
          onCancel={() => onEditingChange(false)}
        />
      </div>
    );
  }

  return (
    <div
      {...rowOpenHandlers}
      className={cn(
        'flex items-center gap-3.5 border-b border-warm-line px-5 py-3 text-sm',
        ROW_OPEN_CLASS
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground">
            {definition.label}
          </span>
          {definition.required && (
            <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
              {t('list.requiredBadge')}
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-ink-3">
          {t(`types.${definition.type}`)}
          {definition.options && definition.options.length > 0 && (
            <> · {definition.options.join(', ')}</>
          )}
        </p>
      </div>

      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon-lg"
          className="text-muted-foreground"
          {...ROW_OPENER}
          onClick={() => onEditingChange(true)}
          aria-label={t('form.edit')}
        >
          <Pencil aria-hidden="true" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon-lg"
          className="text-muted-foreground"
          onClick={() => setIsDeleteOpen(true)}
          aria-label={t('form.delete')}
        >
          <Trash2 aria-hidden="true" />
        </Button>

        <Modal
          open={isDeleteOpen}
          tone="danger"
          title={t('deleteDialog.title', { label: definition.label })}
          description={t('deleteDialog.body')}
          confirmLabel={t('form.delete')}
          cancelLabel={t('form.cancel')}
          confirmPending={isDeleting}
          onConfirm={() => void confirmDelete()}
          onCancel={() => setIsDeleteOpen(false)}
        />
      </div>
    </div>
  );
}
