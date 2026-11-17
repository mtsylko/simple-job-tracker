/**
 * User-defined extra fields on the application form.
 *
 * A definition is metadata only; the values live in `jobs.custom_fields` (jsonb),
 * keyed by the definition's immutable `key`. `key` is generated from the label on
 * create and never changes, so renaming a field's `label` cannot orphan its data.
 */
export type JobFieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'date'
  | 'boolean'
  | 'select'
  | 'multiselect';

export const JOB_FIELD_TYPES: JobFieldType[] = [
  'text',
  'textarea',
  'number',
  'date',
  'boolean',
  'select',
  'multiselect'
];

/** Types whose values are picked from a fixed option list. */
export const JOB_FIELD_TYPES_WITH_OPTIONS: JobFieldType[] = ['select', 'multiselect'];

export function jobFieldTypeHasOptions(type: JobFieldType): boolean {
  return JOB_FIELD_TYPES_WITH_OPTIONS.includes(type);
}

export type JobFieldDefinition = {
  id: string;
  /** Immutable slug; the jsonb key under `jobs.custom_fields`. */
  key: string;
  label: string;
  type: JobFieldType;
  /** Non-null only for select/multiselect. */
  options: string[] | null;
  required: boolean;
  sortOrder: number;
  /** Set when the field is retired. Archived fields stop rendering and reject writes. */
  archivedAt: string | null;
};

export type CreateJobFieldInput = {
  label: string;
  type: JobFieldType;
  options?: string[] | null;
  required?: boolean;
};

/** `key` and `type` are fixed after creation — changing either would strand stored values. */
export type UpdateJobFieldInput = {
  label?: string;
  options?: string[] | null;
  required?: boolean;
};

export type JobCustomFieldValue = string | number | boolean | string[] | null;

export type JobCustomFields = Record<string, JobCustomFieldValue>;
