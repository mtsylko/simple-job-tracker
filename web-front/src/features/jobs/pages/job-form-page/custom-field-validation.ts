import type { TFunction } from 'i18next';
import type {
  JobCustomFields,
  JobCustomFieldValue,
  JobFieldDefinition,
  JobFieldType
} from '@job-tracker/shared';

/** Errors keyed by field `key`; empty when every required field has a value. */
export type CustomFieldErrors = Record<string, string>;

/**
 * True when a required field of this type has no usable value. Mirrors the server's
 * `buildCustomFieldsSchema` so the inline error matches what a submit would be
 * rejected for — text/date/select need a non-empty string, multiselect a non-empty
 * array, number/boolean a value of the right primitive type.
 */
function isMissing(type: JobFieldType, value: JobCustomFieldValue): boolean {
  switch (type) {
    case 'text':
    case 'textarea':
    case 'date':
    case 'select':
      return typeof value !== 'string' || value.trim() === '';
    case 'multiselect':
      return !Array.isArray(value) || value.length === 0;
    case 'number':
      return typeof value !== 'number';
    case 'boolean':
      return typeof value !== 'boolean';
  }
}

/** Validates only what the form can get wrong — required-but-empty; the server
 *  still guards option membership and unknown keys. */
export function validateCustomFields(
  definitions: JobFieldDefinition[],
  values: JobCustomFields,
  t: TFunction<'jobs'>
): CustomFieldErrors {
  const errors: CustomFieldErrors = {};

  for (const definition of definitions) {
    if (!definition.required) {
      continue;
    }

    if (isMissing(definition.type, values[definition.key] ?? null)) {
      errors[definition.key] = t('form.validation.customFieldRequired', {
        label: definition.label
      });
    }
  }

  return errors;
}
