import type { ReactElement } from 'react';
import { useMemo } from 'react';
import type { TFunction } from 'i18next';

import {
  Field,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet
} from '@/components/ui/field';
import { SelectField } from '@/components/ui/select-field';
import {
  createJobContractTypeOption,
  createJobEmploymentTypeOption,
  createJobLevelOption,
  createJobRoleOption,
  createJobTypeOption
} from '@/features/jobs/job-api';
import type { JobFormValues } from '@/features/jobs/types';

import { LocationField } from '@/features/jobs/components/LocationField';

import { EditableSelectField } from './editable-select-field';
import type { SectionField } from './form-field-order';
import { SortableFieldGroup } from './sortable-field-group';
import {
  normalizeUniqueValues,
  type JobFormErrors,
  type JobFormFieldChangeHandler
} from './job-form.schema';

export function RoleDetailsSection({
  values,
  errors,
  roleOptions,
  levelOptions,
  typeOptions,
  employmentTypeOptions,
  contractTypeOptions,
  cvOptions,
  onFieldChange,
  order,
  onOrderChange,
  t
}: {
  values: JobFormValues;
  errors: JobFormErrors;
  roleOptions: string[];
  levelOptions: string[];
  typeOptions: string[];
  employmentTypeOptions: string[];
  contractTypeOptions: string[];
  cvOptions: string[];
  onFieldChange: JobFormFieldChangeHandler;
  order: readonly SectionField<'roleDetails'>[];
  onOrderChange: (next: SectionField<'roleDetails'>[]) => void;
  t: TFunction<'jobs'>;
}) {
  const mergedCvOptions = useMemo(() => {
    const valuesToMerge = normalizeUniqueValues([...cvOptions, values.cv]);
    return valuesToMerge.map((value) => ({ value, label: value }));
  }, [cvOptions, values.cv]);

  const fields = {
    role: (
      <Field className="gap-1.5">
        <FieldLabel htmlFor="job-role">
          {t('form.fields.role')} <span className="text-destructive">*</span>
        </FieldLabel>
        <EditableSelectField
          id="job-role"
          value={values.role}
          onChange={(value) => onFieldChange('role', value)}
          values={roleOptions}
          onPersist={createJobRoleOption}
          addNewOptionLabel={t('form.addNew.role')}
          newOptionPlaceholder={t('form.placeholders.typeNewRole')}
          placeholder={t('form.placeholders.selectRole')}
        />
        <FieldError>{errors.role}</FieldError>
      </Field>
    ),

    level: (
      <Field className="gap-1.5">
        <FieldLabel htmlFor="job-level">
          {t('form.fields.level')} <span className="text-destructive">*</span>
        </FieldLabel>
        <EditableSelectField
          id="job-level"
          value={values.level}
          onChange={(value) => onFieldChange('level', value)}
          values={levelOptions}
          onPersist={createJobLevelOption}
          addNewOptionLabel={t('form.addNew.level')}
          newOptionPlaceholder={t('form.placeholders.typeNewLevel')}
          placeholder={t('form.placeholders.selectLevel')}
        />
        <FieldError>{errors.level}</FieldError>
      </Field>
    ),

    location: (
      <LocationField
        value={values.location}
        error={errors.location}
        onChange={(value) => onFieldChange('location', value)}
      />
    ),

    type: (
      <Field className="gap-1.5">
        <FieldLabel htmlFor="job-type">
          {t('form.fields.workType')}{' '}
          <span className="text-destructive">*</span>
        </FieldLabel>
        <EditableSelectField
          id="job-type"
          value={values.type}
          onChange={(value) => onFieldChange('type', value)}
          values={typeOptions}
          onPersist={createJobTypeOption}
          addNewOptionLabel={t('form.addNew.type')}
          newOptionPlaceholder={t('form.placeholders.typeNewType')}
          placeholder={t('form.placeholders.selectType')}
        />
        <FieldError>{errors.type}</FieldError>
      </Field>
    ),

    employmentType: (
      <Field className="gap-1.5">
        <FieldLabel htmlFor="job-employment-type">
          {t('form.fields.employmentType')}
        </FieldLabel>
        <EditableSelectField
          id="job-employment-type"
          value={values.employmentType}
          onChange={(value) => onFieldChange('employmentType', value)}
          values={employmentTypeOptions}
          onPersist={createJobEmploymentTypeOption}
          addNewOptionLabel={t('form.addNew.employmentType')}
          newOptionPlaceholder={t('form.placeholders.typeNewEmploymentType')}
          placeholder={t('form.placeholders.selectEmploymentType')}
        />
        <FieldError>{errors.employmentType}</FieldError>
      </Field>
    ),

    contractType: (
      <Field className="gap-1.5">
        <FieldLabel htmlFor="job-contract-type">
          {t('form.fields.contractType')}
        </FieldLabel>
        <EditableSelectField
          id="job-contract-type"
          value={values.contractType}
          onChange={(value) => onFieldChange('contractType', value)}
          values={contractTypeOptions}
          onPersist={createJobContractTypeOption}
          addNewOptionLabel={t('form.addNew.contractType')}
          newOptionPlaceholder={t('form.placeholders.typeNewContractType')}
          placeholder={t('form.placeholders.selectContractType')}
        />
        <FieldError>{errors.contractType}</FieldError>
      </Field>
    ),

    cv: (
      <Field className="gap-1.5">
        <FieldLabel htmlFor="job-cv">
          {t('form.fields.cvUsed')} <span className="text-destructive">*</span>
        </FieldLabel>
        <SelectField
          id="job-cv"
          options={mergedCvOptions}
          value={values.cv}
          onChange={(value) => onFieldChange('cv', value)}
          placeholder={t('form.placeholders.selectCv')}
        />
        <FieldError>{errors.cv}</FieldError>
      </Field>
    )
  } satisfies Record<SectionField<'roleDetails'>, ReactElement>;

  return (
    <FieldSet>
      <FieldLegend>{t('form.sections.roleDetails')}</FieldLegend>
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
