import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { STATUS_COLOR_PRESETS, type JobStatusColor } from '@job-tracker/shared';

import { Modal } from '@/components/Modal';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

import { ColorSwatchPicker } from './StatusManager/ColorSwatchPicker';

/** Adds one value to a list; statuses also pick their colour here. */
export function AddOptionDialog({
  open,
  title,
  placeholder,
  existingValues,
  withColor,
  onAdd,
  onClose
}: {
  open: boolean;
  title: string;
  placeholder: string;
  existingValues: string[];
  withColor: boolean;
  onAdd: (value: string, color: JobStatusColor) => Promise<void>;
  onClose: () => void;
}) {
  const { t } = useTranslation('taxonomies');
  const fieldRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState('');
  const [color, setColor] = useState<JobStatusColor>(STATUS_COLOR_PRESETS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    setDraft('');
    setColor(STATUS_COLOR_PRESETS[0]);
    setError(null);
    onClose();
  };

  const submit = async () => {
    const value = draft.trim();
    if (!value) {
      return;
    }

    const isDuplicate = existingValues.some(
      (existing) => existing.toLowerCase() === value.toLowerCase()
    );
    if (isDuplicate) {
      setError(t('duplicate'));
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await onAdd(value, color);
      close();
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : t('addError')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      title={title}
      confirmLabel={t('addButton')}
      cancelLabel={t('cancel')}
      confirmPending={isSubmitting}
      confirmDisabled={draft.trim().length === 0}
      initialFocus={fieldRef}
      onConfirm={() => void submit()}
      onCancel={close}
    >
      <div className="flex items-end gap-4">
        <Field className="flex-1 gap-1.5">
          <FieldLabel htmlFor="add-option-name">{t('columns.name')}</FieldLabel>
          <Input
            ref={fieldRef}
            id="add-option-name"
            value={draft}
            placeholder={placeholder}
            disabled={isSubmitting}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? 'add-option-error' : undefined}
            onChange={(event) => {
              setDraft(event.target.value);
              if (error) setError(null);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                void submit();
              }
            }}
          />
        </Field>
        {withColor && (
          <Field className="w-auto flex-none items-center gap-1.5">
            {/* The swatch button names itself; this only labels it on screen */}
            <span aria-hidden="true" className="text-sm font-medium">
              {t('sections.status.colorLabel')}
            </span>
            <div className="flex h-8 items-center">
              <ColorSwatchPicker
                color={color}
                onChange={setColor}
                disabled={isSubmitting}
              />
            </div>
          </Field>
        )}
      </div>
      {error && (
        <p id="add-option-error" className="mt-1.5 text-xs text-destructive">
          {error}
        </p>
      )}
    </Modal>
  );
}
