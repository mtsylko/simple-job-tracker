import type { ReactElement } from 'react';
import type { TFunction } from 'i18next';
import { RefreshCw } from 'lucide-react';
import { z } from 'zod';

import { LocalizedDatePicker } from '@/components/LocalizedDatePicker';
import { CheckboxField } from '@/components/ui/checkbox-field';
import {
  LOCALE_DATE_DISPLAY_FORMAT,
  LOCALE_DATE_PLACEHOLDER
} from '@/lib/format-date';
import {
  Field,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet
} from '@/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput
} from '@/components/ui/input-group';
import { CompanyCombobox } from '@/features/jobs/components/CompanyCombobox';
import type { JobFormValues } from '@/features/jobs/types';

import type { SectionField } from './form-field-order';
import type {
  JobFormErrors,
  JobFormFieldChangeHandler
} from './job-form.schema';
import { SortableFieldGroup } from './sortable-field-group';

const jobPostLinkSchema = z.url();

export function ApplicationDetailsSection({
  values,
  errors,
  companyOptions,
  onFieldChange,
  onExtractFromLink,
  canExtractFromLink,
  isExtracting,
  extractError,
  order,
  onOrderChange,
  t
}: {
  values: JobFormValues;
  errors: JobFormErrors;
  companyOptions: string[];
  onFieldChange: JobFormFieldChangeHandler;
  onExtractFromLink: () => void;
  /** Only the extension can read a posting, so the button waits for one. */
  canExtractFromLink: boolean;
  isExtracting: boolean;
  extractError: string | null;
  order: readonly SectionField<'applicationDetails'>[];
  onOrderChange: (next: SectionField<'applicationDetails'>[]) => void;
  t: TFunction<'jobs'>;
}) {
  const fields = {
    company: (
      <Field className="gap-1.5">
        <FieldLabel htmlFor="job-company">
          {t('form.fields.companyName')}{' '}
          <span className="text-destructive">*</span>
        </FieldLabel>
        <CompanyCombobox
          id="job-company"
          value={values.company}
          options={companyOptions}
          onChange={(nextValue) => onFieldChange('company', nextValue)}
        />
        <FieldError>{errors.company}</FieldError>
      </Field>
    ),

    jobPostLink: (
      <Field className="gap-1.5">
        <FieldLabel htmlFor="job-post-link">
          {t('form.fields.jobPostLink')}{' '}
          <span className="text-destructive">*</span>
        </FieldLabel>
        <InputGroup>
          <InputGroupInput
            id="job-post-link"
            value={values.jobPostLink}
            onChange={(event) =>
              onFieldChange('jobPostLink', event.currentTarget.value)
            }
          />
          {canExtractFromLink && (
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                type="button"
                size="icon-xs"
                disabled={
                  isExtracting ||
                  !jobPostLinkSchema.safeParse(values.jobPostLink.trim())
                    .success
                }
                aria-label={t('form.fields.jobPostLinkRefresh')}
                onClick={onExtractFromLink}
              >
                <RefreshCw
                  className={`size-3.5 ${isExtracting ? 'animate-spin' : ''}`}
                  aria-hidden="true"
                />
              </InputGroupButton>
            </InputGroupAddon>
          )}
        </InputGroup>
        <FieldError>{errors.jobPostLink ?? extractError}</FieldError>
      </Field>
    ),

    appliedAt: (
      <Field className="gap-1.5">
        <FieldLabel htmlFor="job-applied-at">
          {t('form.fields.dateOfApplication')}{' '}
          <span className="text-destructive">*</span>
        </FieldLabel>
        <LocalizedDatePicker
          id="job-applied-at"
          value={values.appliedAt}
          onValueChange={(value) => onFieldChange('appliedAt', value)}
          displayFormat={LOCALE_DATE_DISPLAY_FORMAT}
          placeholder={LOCALE_DATE_PLACEHOLDER}
        />
        <FieldError>{errors.appliedAt}</FieldError>
      </Field>
    ),

    isProductCompany: (
      <Field className="gap-1.5">
        <FieldLabel
          htmlFor="job-is-product-company"
          className="justify-between"
        >
          <span>{t('form.fields.companyType')}</span>
        </FieldLabel>
        <CheckboxField
          id="job-is-product-company"
          className="h-9 gap-2.5"
          checkboxClassName="size-4.5"
          label={t('form.fields.productCompanyCheckbox')}
          checked={values.isProductCompany}
          onCheckedChange={(checked) =>
            onFieldChange('isProductCompany', checked)
          }
        />
      </Field>
    )
  } satisfies Record<SectionField<'applicationDetails'>, ReactElement>;

  return (
    <FieldSet>
      <FieldLegend>{t('form.sections.applicationDetails')}</FieldLegend>
      <SortableFieldGroup
        order={order}
        onOrderChange={onOrderChange}
        renderField={(field) => fields[field]}
        reorderLabel={t('form.reorderField')}
        className="grid gap-4 md:grid-cols-2 md:items-start"
      />
    </FieldSet>
  );
}
