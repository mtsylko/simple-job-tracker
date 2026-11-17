import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button.tsx';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput
} from '@/components/ui/input-group.tsx';
import { type SelectFieldOption } from '@/components/ui/select-field.tsx';
import { cn } from '@/lib/utils';

import { FilterPopover } from './FilterPopover';
import {
  countHiddenFilters,
  type JobFilterValues
} from './use-job-list-url-filters';

type JobListFilterBarProps = {
  values: JobFilterValues;
  onChange: <K extends keyof JobFilterValues>(
    name: K,
    value: JobFilterValues[K]
  ) => void;
  onClearAll: () => void;
  roleOptions: SelectFieldOption[];
  typeOptions: SelectFieldOption[];
  employmentTypeOptions: SelectFieldOption[];
  contractTypeOptions: SelectFieldOption[];
  levelOptions: SelectFieldOption[];
  outcomeOptions: SelectFieldOption[];
  className?: string;
};

export function Filters({
  values,
  onChange,
  onClearAll,
  roleOptions,
  typeOptions,
  employmentTypeOptions,
  contractTypeOptions,
  levelOptions,
  outcomeOptions,
  className
}: JobListFilterBarProps) {
  const { t } = useTranslation('jobs');

  const hasActiveFilters =
    values.company.trim() !== '' || countHiddenFilters(values) > 0;

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <InputGroup className="w-56">
        <InputGroupAddon align="inline-start">
          <Search className="size-3.5" aria-hidden="true" />
        </InputGroupAddon>
        <InputGroupInput
          aria-label={t('list.filters.companyLabel')}
          placeholder={t('list.filters.companyPlaceholder')}
          value={values.company}
          onChange={(e) => onChange('company', e.currentTarget.value)}
        />
      </InputGroup>

      <FilterPopover
        values={values}
        onChange={onChange}
        roleOptions={roleOptions}
        typeOptions={typeOptions}
        employmentTypeOptions={employmentTypeOptions}
        contractTypeOptions={contractTypeOptions}
        levelOptions={levelOptions}
        outcomeOptions={outcomeOptions}
      />

      {hasActiveFilters && (
        <Button type="button" variant="ghost" onClick={onClearAll}>
          {t('list.filters.clearAll')}
        </Button>
      )}
    </div>
  );
}
