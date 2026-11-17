import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  JOB_FIELD_TYPES,
  jobFieldTypeHasOptions,
  type JobFieldType
} from '@job-tracker/shared';

import { Button } from '@/components/ui/button';
import { CheckboxField } from '@/components/ui/checkbox-field';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { SelectField } from '@/components/ui/select-field';

import { OptionsEditor } from './OptionsEditor';

export type JobFieldFormValues = {
  label: string;
  type: JobFieldType;
  required: boolean;
  options: string[];
};

const emptyJobFieldFormValues: JobFieldFormValues = {
  label: '',
  type: 'text',
  required: false,
  options: []
};

/**
 * The add/edit form for one field. `lockType` is set when editing — the field's
 * type is immutable server-side, so changing it would strand stored values.
 */
export function JobFieldForm({
  initialValues = emptyJobFieldFormValues,
  lockType = false,
  submitLabel,
  onSubmit,
  onCancel
}: {
  initialValues?: JobFieldFormValues;
  lockType?: boolean;
  submitLabel: string;
  onSubmit: (values: JobFieldFormValues) => Promise<void>;
  onCancel: () => void;
}) {
  const { t } = useTranslation('jobFields');
  const [values, setValues] = useState<JobFieldFormValues>(initialValues);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [labelError, setLabelError] = useState<string | null>(null);
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const hasOptions = jobFieldTypeHasOptions(values.type);

  const typeOptions = JOB_FIELD_TYPES.map((type) => ({
    value: type,
    label: t(`types.${type}`)
  }));

  const submit = async () => {
    const label = values.label.trim();
    let valid = true;

    if (!label) {
      setLabelError(t('validation.labelRequired'));
      valid = false;
    }
    if (hasOptions && values.options.length === 0) {
      setOptionsError(t('validation.optionsRequired'));
      valid = false;
    }
    if (!valid) {
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);
    try {
      await onSubmit({
        ...values,
        label,
        options: hasOptions ? values.options : []
      });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : submitLabel);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-5">
      <Field className="gap-1.5">
        <FieldLabel htmlFor="job-field-label">
          {t('form.labelLabel')}
        </FieldLabel>
        <Input
          id="job-field-label"
          autoFocus
          value={values.label}
          placeholder={t('form.labelPlaceholder')}
          disabled={isSubmitting}
          onChange={(event) => {
            setValues((prev) => ({ ...prev, label: event.target.value }));
            if (labelError) setLabelError(null);
          }}
        />
        <FieldError>{labelError}</FieldError>
      </Field>

      <Field className="gap-1.5">
        <FieldLabel htmlFor="job-field-type">{t('form.typeLabel')}</FieldLabel>
        <SelectField
          id="job-field-type"
          options={typeOptions}
          value={values.type}
          disabled={lockType || isSubmitting}
          onChange={(next) =>
            setValues((prev) => ({ ...prev, type: next as JobFieldType }))
          }
        />
        {lockType && (
          <p className="text-xs text-muted-foreground">
            {t('form.typeLockedHint')}
          </p>
        )}
      </Field>

      {hasOptions && (
        <Field className="gap-1.5">
          <FieldLabel htmlFor="job-field-options">
            {t('form.optionsLabel')}
          </FieldLabel>
          <OptionsEditor
            inputId="job-field-options"
            options={values.options}
            onChange={(next) => {
              setValues((prev) => ({ ...prev, options: next }));
              if (optionsError) setOptionsError(null);
            }}
          />
          <FieldError>{optionsError}</FieldError>
        </Field>
      )}

      <CheckboxField
        id="job-field-required"
        label={t('form.requiredLabel')}
        checked={values.required}
        disabled={isSubmitting}
        onCheckedChange={(checked) =>
          setValues((prev) => ({ ...prev, required: checked }))
        }
      />

      {submitError && <p className="text-xs text-destructive">{submitError}</p>}

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          {t('form.cancel')}
        </Button>
        <Button
          type="button"
          onClick={() => void submit()}
          disabled={isSubmitting || values.label.trim().length === 0}
        >
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}
