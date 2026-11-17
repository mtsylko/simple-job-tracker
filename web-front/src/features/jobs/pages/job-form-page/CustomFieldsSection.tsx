import type { TFunction } from 'i18next';
import type {
  JobCustomFields,
  JobCustomFieldValue,
  JobFieldDefinition
} from '@job-tracker/shared';

import { FieldLegend, FieldSet } from '@/components/ui/field';

import { CustomFieldInput } from './CustomFieldInput';
import type { CustomFieldErrors } from './custom-field-validation';

/**
 * The "Additional fields" section, appended after the built-in ones. It renders
 * one input per active user-defined field; when the user has none, the whole
 * section is omitted so the form is unchanged for them.
 */
export function CustomFieldsSection({
  definitions,
  values,
  errors,
  onFieldChange,
  t
}: {
  definitions: JobFieldDefinition[];
  values: JobCustomFields;
  errors: CustomFieldErrors;
  onFieldChange: (key: string, value: JobCustomFieldValue) => void;
  t: TFunction<'jobs'>;
}) {
  if (definitions.length === 0) {
    return null;
  }

  return (
    <FieldSet>
      <FieldLegend>{t('form.sections.customFields')}</FieldLegend>
      <div className="grid gap-4 md:grid-cols-2 md:items-start">
        {definitions.map((definition) => (
          <CustomFieldInput
            key={definition.id}
            definition={definition}
            value={values[definition.key] ?? null}
            error={errors[definition.key]}
            onChange={(value) => onFieldChange(definition.key, value)}
            t={t}
          />
        ))}
      </div>
    </FieldSet>
  );
}
