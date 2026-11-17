import type { ReactElement } from 'react';
import type { TFunction } from 'i18next';

import {
  Field,
  FieldLabel,
  FieldLegend,
  FieldSet
} from '@/components/ui/field';
import { LabelHint } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { JobFormValues } from '@/features/jobs/types';

import type { SectionField } from './form-field-order';
import type { JobFormFieldChangeHandler } from './job-form.schema';
import { SortableFieldGroup } from './sortable-field-group';

export function NotesSection({
  values,
  onFieldChange,
  order,
  onOrderChange,
  t
}: {
  values: JobFormValues;
  onFieldChange: JobFormFieldChangeHandler;
  order: readonly SectionField<'notes'>[];
  onOrderChange: (next: SectionField<'notes'>[]) => void;
  t: TFunction<'jobs'>;
}) {
  const fields = {
    notes: (
      <Field className="gap-1.5">
        <FieldLabel htmlFor="job-notes">{t('form.fields.notes')}</FieldLabel>
        <Textarea
          id="job-notes"
          value={values.notes}
          onChange={(event) =>
            onFieldChange('notes', event.currentTarget.value)
          }
          rows={4}
        />
      </Field>
    ),

    applicationQuestions: (
      <Field className="gap-1.5">
        <FieldLabel
          htmlFor="job-application-questions"
          className="justify-between"
        >
          <span>{t('form.fields.applicationQuestions')}</span>
          <LabelHint>{t('form.fields.applicationQuestionsHint')}</LabelHint>
        </FieldLabel>
        <Textarea
          id="job-application-questions"
          value={values.applicationQuestions}
          onChange={(event) =>
            onFieldChange('applicationQuestions', event.currentTarget.value)
          }
          rows={4}
        />
      </Field>
    )
  } satisfies Record<SectionField<'notes'>, ReactElement>;

  return (
    <FieldSet>
      <FieldLegend>{t('form.sections.notesQuestions')}</FieldLegend>
      <SortableFieldGroup
        order={order}
        onOrderChange={onOrderChange}
        renderField={(field) => fields[field]}
        reorderLabel={t('form.reorderField')}
      />
    </FieldSet>
  );
}
