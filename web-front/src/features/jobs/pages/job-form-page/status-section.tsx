import { useEffect, type ReactElement } from 'react';
import type { TFunction } from 'i18next';
import type { JobStatusOption } from '@job-tracker/shared';

import {
  Field,
  FieldLabel,
  FieldLegend,
  FieldSet
} from '@/components/ui/field';
import { SelectField } from '@/components/ui/select-field';
import { type JobFormValues } from '@/features/jobs/types';
import { statusBadgeStyle } from '@/features/jobs/status-badge-colors';
import { handleRadioGroupKeyDown, radioTabIndex } from '@/lib/radio-group-keys';

import type { SectionField } from './form-field-order';
import type { JobFormFieldChangeHandler } from './job-form.schema';
import { SortableFieldGroup } from './sortable-field-group';

export function StatusSection({
  values,
  statusOptions,
  outcomeOptions,
  onFieldChange,
  order,
  onOrderChange,
  t
}: {
  values: JobFormValues;
  statusOptions: JobStatusOption[];
  outcomeOptions: string[];
  onFieldChange: JobFormFieldChangeHandler;
  order: readonly SectionField<'status'>[];
  onOrderChange: (next: SectionField<'status'>[]) => void;
  t: TFunction<'jobs'>;
}) {
  // A new job starts with no status; default to the user's default option once
  // the list loads. An existing job already has one, so this leaves it alone.
  useEffect(() => {
    if (values.status || statusOptions.length === 0) {
      return;
    }
    const fallback =
      statusOptions.find((option) => option.isDefault) ?? statusOptions[0];
    onFieldChange('status', fallback.value);
  }, [values.status, statusOptions, onFieldChange]);

  const hasCheckedStatus = statusOptions.some(
    (option) => option.value === values.status
  );

  const fields = {
    statusPicker: (
      <div
        role="radiogroup"
        aria-label={t('form.fields.status')}
        className="flex flex-wrap gap-2"
      >
        {statusOptions.map((option, index) => {
          const badge = statusBadgeStyle(option.color);
          const isChecked = values.status === option.value;
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={isChecked}
              tabIndex={radioTabIndex(isChecked, index, hasCheckedStatus)}
              onClick={() => onFieldChange('status', option.value)}
              onKeyDown={(event) =>
                handleRadioGroupKeyDown(event, (next) =>
                  onFieldChange('status', statusOptions[next].value)
                )
              }
              style={badge.badge}
              /*
                Selection is carried by the ring, not by fading the unselected chips.
                `opacity-60` dimmed the label along with the badge and composited both
                down to ~2.5:1 against the card — these are selectable options, so they
                get no exemption from the 4.5:1 the badge palette is built to clear.
              */
              className={`status-badge cursor-pointer transition-shadow ${
                isChecked
                  ? 'ring-2 ring-clay ring-offset-1'
                  : 'hover:ring-2 hover:ring-warm-line-2 hover:ring-offset-1'
              }`}
            >
              <span className="status-badge-dot" style={badge.dot} />
              {option.value}
            </button>
          );
        })}
      </div>
    ),

    outcome: (
      <Field className="gap-1.5 md:max-w-80">
        <FieldLabel htmlFor="job-outcome">
          {t('form.fields.outcomeOptional')}
        </FieldLabel>
        <SelectField
          id="job-outcome"
          options={[
            { value: '', label: t('form.placeholders.noOutcomeYet') },
            ...outcomeOptions.map((value) => ({ value, label: value }))
          ]}
          value={values.outcome}
          onChange={(value) =>
            onFieldChange('outcome', value as JobFormValues['outcome'])
          }
          placeholder={t('form.placeholders.selectOutcome')}
        />
      </Field>
    )
  } satisfies Record<SectionField<'status'>, ReactElement>;

  return (
    <FieldSet>
      <FieldLegend className="mb-2">
        {t('form.sections.applicationStatus')}
      </FieldLegend>
      {/*
        gap-8 replaces the old `mt-4` on the outcome field: a margin on one specific
        item would follow that item around once the order can change, so the spacing
        moves to the group. 16px gap + 16px margin == the 32px this renders.
      */}
      <SortableFieldGroup
        order={order}
        onOrderChange={onOrderChange}
        renderField={(field) => fields[field]}
        reorderLabel={t('form.reorderField')}
        className="gap-8"
      />
    </FieldSet>
  );
}
