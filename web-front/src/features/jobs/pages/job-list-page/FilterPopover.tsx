import { SlidersHorizontal } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { buttonVariants } from '@/components/ui/button-variants';
import { CheckboxField } from '@/components/ui/checkbox-field';
import { Field, FieldLabel } from '@/components/ui/field';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { type SelectFieldOption } from '@/components/ui/select-field';
import {
  LOCALE_DATE_DISPLAY_FORMAT,
  LOCALE_DATE_PLACEHOLDER
} from '@/lib/format-date';
import { cn } from '@/lib/utils';

import { FilterDatePicker } from './FilterDatePicker';
import { FilterSelectField } from './FilterSelectField';
import {
  countHiddenFilters,
  type JobFilterValues
} from './use-job-list-url-filters';

type FilterPopoverProps = {
  values: JobFilterValues;
  onChange: <K extends keyof JobFilterValues>(
    name: K,
    value: JobFilterValues[K]
  ) => void;
  roleOptions: SelectFieldOption[];
  typeOptions: SelectFieldOption[];
  employmentTypeOptions: SelectFieldOption[];
  contractTypeOptions: SelectFieldOption[];
  levelOptions: SelectFieldOption[];
  outcomeOptions: SelectFieldOption[];
};

/**
 * Holds every filter that does not earn a permanent slot on the toolbar. The
 * trigger carries the active count so nothing hidden here goes unnoticed.
 */
export function FilterPopover({
  values,
  onChange,
  roleOptions,
  typeOptions,
  employmentTypeOptions,
  contractTypeOptions,
  levelOptions,
  outcomeOptions
}: FilterPopoverProps) {
  const { t } = useTranslation('jobs');
  const activeCount = countHiddenFilters(values);

  return (
    <Popover>
      <PopoverTrigger
        type="button"
        className={cn(buttonVariants({ variant: 'outline' }), 'gap-1.5')}
      >
        <SlidersHorizontal className="size-3.5" aria-hidden="true" />
        {t('list.filters.button')}
        {activeCount > 0 && (
          <span className="num rounded-full bg-primary/10 px-1.5 text-2xs text-primary">
            {activeCount}
          </span>
        )}
      </PopoverTrigger>

      {/* Capped by the room base-ui measures, less the padding box-content adds */}
      <PopoverContent
        align="start"
        className="box-content w-96 max-w-[calc(var(--available-width)-2rem)] p-4"
      >
        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          <Field className="gap-1.5">
            <FieldLabel htmlFor="job-list-filter-role">
              {t('list.filters.roleLabel')}
            </FieldLabel>
            <FilterSelectField
              id="job-list-filter-role"
              options={roleOptions}
              value={values.role}
              onChange={(value) => onChange('role', value)}
              clearLabel={t('list.filters.clearFilter')}
            />
          </Field>

          <Field className="gap-1.5">
            <FieldLabel htmlFor="job-list-filter-level">
              {t('list.filters.levelLabel')}
            </FieldLabel>
            <FilterSelectField
              id="job-list-filter-level"
              options={levelOptions}
              value={values.level}
              onChange={(value) => onChange('level', value)}
              clearLabel={t('list.filters.clearFilter')}
            />
          </Field>

          <Field className="gap-1.5">
            <FieldLabel htmlFor="job-list-filter-type">
              {t('list.filters.typeLabel')}
            </FieldLabel>
            <FilterSelectField
              id="job-list-filter-type"
              options={typeOptions}
              value={values.type}
              onChange={(value) => onChange('type', value)}
              clearLabel={t('list.filters.clearFilter')}
            />
          </Field>

          <Field className="gap-1.5">
            <FieldLabel htmlFor="job-list-filter-employment-type">
              {t('list.filters.employmentTypeLabel')}
            </FieldLabel>
            <FilterSelectField
              id="job-list-filter-employment-type"
              options={employmentTypeOptions}
              value={values.employmentType}
              onChange={(value) => onChange('employmentType', value)}
              clearLabel={t('list.filters.clearFilter')}
            />
          </Field>

          <Field className="gap-1.5">
            <FieldLabel htmlFor="job-list-filter-contract-type">
              {t('list.filters.contractTypeLabel')}
            </FieldLabel>
            <FilterSelectField
              id="job-list-filter-contract-type"
              options={contractTypeOptions}
              value={values.contractType}
              onChange={(value) => onChange('contractType', value)}
              clearLabel={t('list.filters.clearFilter')}
            />
          </Field>

          <Field className="gap-1.5">
            <FieldLabel htmlFor="job-list-filter-outcome">
              {t('list.filters.outcomeLabel')}
            </FieldLabel>
            <FilterSelectField
              id="job-list-filter-outcome"
              options={outcomeOptions}
              value={values.outcome}
              onChange={(value) => onChange('outcome', value)}
              clearLabel={t('list.filters.clearFilter')}
            />
          </Field>

          <Field className="gap-1.5">
            <FieldLabel htmlFor="job-list-filter-applied-from">
              {t('list.filters.appliedFromLabel')}
            </FieldLabel>
            <FilterDatePicker
              id="job-list-filter-applied-from"
              value={values.appliedFrom}
              onValueChange={(value) => onChange('appliedFrom', value)}
              displayFormat={LOCALE_DATE_DISPLAY_FORMAT}
              placeholder={LOCALE_DATE_PLACEHOLDER}
              clearLabel={t('list.filters.clearDate')}
            />
          </Field>

          <Field className="gap-1.5">
            <FieldLabel htmlFor="job-list-filter-applied-to">
              {t('list.filters.appliedToLabel')}
            </FieldLabel>
            <FilterDatePicker
              id="job-list-filter-applied-to"
              value={values.appliedTo}
              onValueChange={(value) => onChange('appliedTo', value)}
              displayFormat={LOCALE_DATE_DISPLAY_FORMAT}
              placeholder={LOCALE_DATE_PLACEHOLDER}
              clearLabel={t('list.filters.clearDate')}
            />
          </Field>

          <CheckboxField
            id="job-list-filter-product-company"
            className="col-span-2 -mx-4 mt-1 border-t px-4 pt-3"
            label={t('list.filters.productCompanyCheckbox')}
            checked={values.productOnly}
            onCheckedChange={(checked) =>
              onChange('productOnly', checked === true)
            }
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
