import { useState } from 'react';
import type { TFunction } from 'i18next';
import type { JobCustomFields, JobCustomFieldValue } from '@job-tracker/shared';

import {
  validateCustomFields,
  type CustomFieldErrors
} from './custom-field-validation';
import { useJobFieldDefinitions } from './use-job-field-definitions';

/**
 * Owns the custom-fields slice of the job form: the active definitions, the inline
 * errors, and the change/validate handlers. The values themselves stay in the parent
 * form state, so the caller passes the current `customFields` and a functional setter
 * for that slice; everything else lives here so the page component only wires the
 * built-in fields.
 */
export function useCustomFields({
  customFields,
  setCustomFields,
  t
}: {
  customFields: JobCustomFields;
  setCustomFields: (
    updater: (prev: JobCustomFields) => JobCustomFields
  ) => void;
  t: TFunction<'jobs'>;
}) {
  const { definitions } = useJobFieldDefinitions();
  const [errors, setErrors] = useState<CustomFieldErrors>({});

  function handleChange(key: string, value: JobCustomFieldValue) {
    setCustomFields((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!(key in prev)) {
        return prev;
      }

      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  // Validates required fields, stores the errors inline, and reports whether the
  // slice is submit-ready. Errors render under each field, so there is no
  // form-level message to raise.
  function validate(): boolean {
    const nextErrors = validateCustomFields(definitions, customFields, t);
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  return { definitions, errors, handleChange, validate };
}
