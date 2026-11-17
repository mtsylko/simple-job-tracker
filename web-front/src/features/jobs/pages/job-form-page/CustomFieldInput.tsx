import type { TFunction } from 'i18next';
import type {
  JobCustomFieldValue,
  JobFieldDefinition
} from '@job-tracker/shared';

import { CheckboxField } from '@/components/ui/checkbox-field';
import { LocalizedDatePicker } from '@/components/LocalizedDatePicker';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { MultiSelectField } from '@/components/ui/multi-select-field';
import { SelectField } from '@/components/ui/select-field';
import { Textarea } from '@/components/ui/textarea';
import {
  LOCALE_DATE_DISPLAY_FORMAT,
  LOCALE_DATE_PLACEHOLDER
} from '@/lib/format-date';

function asString(value: JobCustomFieldValue): string {
  return typeof value === 'string' ? value : '';
}

function asStringArray(value: JobCustomFieldValue): string[] {
  return Array.isArray(value) ? value : [];
}

function toOptions(options: string[] | null) {
  return (options ?? []).map((option) => ({ value: option, label: option }));
}

/**
 * Renders one user-defined field as the input matching its type. The control is
 * chosen from the shared `ui` primitives — the same ones the built-in fields use —
 * so custom fields look and behave identically to the rest of the form.
 */
export function CustomFieldInput({
  definition,
  value,
  onChange,
  error,
  t
}: {
  definition: JobFieldDefinition;
  value: JobCustomFieldValue;
  onChange: (value: JobCustomFieldValue) => void;
  error?: string;
  t: TFunction<'jobs'>;
}) {
  const inputId = `custom-field-${definition.key}`;

  // Boolean renders the checkbox as its own label row, so it skips the shared
  // label/error frame the other types share below.
  if (definition.type === 'boolean') {
    return (
      <Field className="gap-1.5">
        <CheckboxField
          id={inputId}
          className="h-9 gap-2.5"
          checkboxClassName="size-4.5"
          label={definition.label}
          checked={value === true}
          onCheckedChange={(checked) => onChange(checked)}
        />
        <FieldError>{error}</FieldError>
      </Field>
    );
  }

  return (
    <Field className="gap-1.5">
      <FieldLabel htmlFor={inputId}>
        {definition.label}
        {definition.required && <span className="text-destructive"> *</span>}
      </FieldLabel>
      {renderControl()}
      <FieldError>{error}</FieldError>
    </Field>
  );

  function renderControl() {
    switch (definition.type) {
      case 'textarea':
        return (
          <Textarea
            id={inputId}
            value={asString(value)}
            onChange={(event) => onChange(event.currentTarget.value)}
          />
        );
      case 'number':
        return (
          <Input
            id={inputId}
            type="number"
            value={typeof value === 'number' ? String(value) : ''}
            onChange={(event) => {
              const raw = event.currentTarget.value.trim();
              if (raw === '') {
                onChange(null);
                return;
              }
              const parsed = Number(raw);
              onChange(Number.isNaN(parsed) ? null : parsed);
            }}
          />
        );
      case 'date':
        return (
          <LocalizedDatePicker
            id={inputId}
            value={asString(value)}
            onValueChange={(next) => onChange(next)}
            displayFormat={LOCALE_DATE_DISPLAY_FORMAT}
            placeholder={LOCALE_DATE_PLACEHOLDER}
          />
        );
      case 'select':
        return (
          <SelectField
            id={inputId}
            options={toOptions(definition.options)}
            value={asString(value)}
            onChange={(next) => onChange(next)}
            placeholder={t('form.placeholders.selectType')}
          />
        );
      case 'multiselect':
        return (
          <MultiSelectField
            id={inputId}
            options={toOptions(definition.options)}
            values={asStringArray(value)}
            onChange={(next) => onChange(next)}
            placeholder={t('form.placeholders.selectType')}
            emptyLabel={t('multiSelect.empty', { ns: 'common' })}
          />
        );
      case 'text':
      default:
        return (
          <Input
            id={inputId}
            value={asString(value)}
            onChange={(event) => onChange(event.currentTarget.value)}
          />
        );
    }
  }
}
