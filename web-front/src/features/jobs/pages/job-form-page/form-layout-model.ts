import type { FormLayout } from '@job-tracker/shared';

/**
 * The draggable items in each section, in declaration order — which is also the
 * fallback order before anything has been reordered.
 *
 * These ids are presentation keys, not `JobFormValues` keys: `statusPicker` is the
 * status badge row, which is a control rather than a named form value.
 */
export const FORM_SECTION_FIELDS = {
  applicationDetails: [
    'company',
    'jobPostLink',
    'appliedAt',
    'isProductCompany'
  ],
  roleDetails: [
    'role',
    'level',
    'location',
    'type',
    'employmentType',
    'contractType',
    'cv'
  ],
  status: ['statusPicker', 'outcome'],
  compensation: ['salaryRange', 'salaryExpectations'],
  notes: ['notes', 'applicationQuestions']
} as const;

export type FormSection = keyof typeof FORM_SECTION_FIELDS;

export type SectionField<S extends FormSection> =
  (typeof FORM_SECTION_FIELDS)[S][number];

export type FieldOrders = { [S in FormSection]: SectionField<S>[] };

export const FORM_SECTIONS = Object.keys(FORM_SECTION_FIELDS) as FormSection[];

export function defaultOrders(): FieldOrders {
  return {
    applicationDetails: [...FORM_SECTION_FIELDS.applicationDetails],
    roleDetails: [...FORM_SECTION_FIELDS.roleDetails],
    status: [...FORM_SECTION_FIELDS.status],
    compensation: [...FORM_SECTION_FIELDS.compensation],
    notes: [...FORM_SECTION_FIELDS.notes]
  };
}

/**
 * Merges a stored order with the fields the form actually renders today.
 *
 * A layout persisted by an older build can name fields that no longer exist and
 * omit ones that were added since, so stored ids are filtered to what is known and
 * any missing field is appended in declaration order. Without this a renamed field
 * would silently vanish from the form.
 */
export function reconcileSection<S extends FormSection>(
  section: S,
  stored: readonly string[] | undefined
): SectionField<S>[] {
  const known = FORM_SECTION_FIELDS[section] as readonly SectionField<S>[];
  const seen = new Set<string>();
  const ordered: SectionField<S>[] = [];

  for (const id of stored ?? []) {
    if (known.includes(id as SectionField<S>) && !seen.has(id)) {
      seen.add(id);
      ordered.push(id as SectionField<S>);
    }
  }

  return [...ordered, ...known.filter((id) => !seen.has(id))];
}

export function reconcileLayout(layout: FormLayout): FieldOrders {
  const orders = defaultOrders();
  for (const section of FORM_SECTIONS) {
    orders[section] = reconcileSection(section, layout[section]) as never;
  }

  return orders;
}

export function toLayout(orders: FieldOrders): FormLayout {
  return Object.fromEntries(
    FORM_SECTIONS.map((section) => [section, [...orders[section]]])
  );
}
