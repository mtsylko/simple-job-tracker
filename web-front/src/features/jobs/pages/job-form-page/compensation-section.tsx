import type { ReactElement } from 'react';
import type { TFunction } from 'i18next';

import {
  Field,
  FieldLabel,
  FieldLegend,
  FieldSet
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import type { JobFormValues } from '@/features/jobs/types';

import type { SectionField } from './form-field-order';
import type { JobFormFieldChangeHandler } from './job-form.schema';
import { SortableFieldGroup } from './sortable-field-group';

export function CompensationSection({
  values,
  onFieldChange,
  order,
  onOrderChange,
  t
}: {
  values: JobFormValues;
  onFieldChange: JobFormFieldChangeHandler;
  order: readonly SectionField<'compensation'>[];
  onOrderChange: (next: SectionField<'compensation'>[]) => void;
  t: TFunction<'jobs'>;
}) {
  // `satisfies Record<…>` makes this exhaustive in both directions: adding a field
  // to the section without adding it here is a compile error, and so is a key that
  // is not a field of this section.
  const fields = {
    salaryRange: (
      <Field className="gap-1.5">
        <FieldLabel htmlFor="job-salary-range">
          {t('form.fields.postedSalaryRange')}
        </FieldLabel>
        <Input
          id="job-salary-range"
          value={values.salaryRange}
          onChange={(event) =>
            onFieldChange('salaryRange', event.currentTarget.value)
          }
        />
      </Field>
    ),

    salaryExpectations: (
      <Field className="gap-1.5">
        <FieldLabel
          htmlFor="job-salary-expectations"
          className="justify-between"
        >
          <span>{t('form.fields.mySalaryExpectation')}</span>
        </FieldLabel>
        <Input
          id="job-salary-expectations"
          value={values.salaryExpectations}
          onChange={(event) =>
            onFieldChange('salaryExpectations', event.currentTarget.value)
          }
        />
      </Field>
    )
  } satisfies Record<SectionField<'compensation'>, ReactElement>;

  return (
    <FieldSet>
      <FieldLegend>{t('form.sections.compensation')}</FieldLegend>
      <SortableFieldGroup
        order={order}
        onOrderChange={onOrderChange}
        renderField={(field) => fields[field]}
        reorderLabel={t('form.reorderField')}
        className="grid gap-4 md:grid-cols-2"
      />
    </FieldSet>
  );
}
