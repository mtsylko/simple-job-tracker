import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import {
  SearchComboboxField,
  type SearchComboboxOption
} from '@/components/ui/search-combobox-field';
import { normalizeCompanyName } from '@/features/jobs/components/company-combobox-utils';
import { useSearchComboboxLabels } from '@/lib/ui-labels';

type CompanyComboboxProps = {
  id?: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
};

function toCompanyKey(value: string): string {
  return normalizeCompanyName(value).toLocaleLowerCase();
}

function normalizeCompanyOptions(values: string[]): SearchComboboxOption[] {
  const seen = new Set<string>();
  const normalizedOptions: SearchComboboxOption[] = [];

  for (const value of values) {
    const normalizedValue = normalizeCompanyName(value);
    if (normalizedValue.length === 0) {
      continue;
    }

    const key = toCompanyKey(normalizedValue);
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    normalizedOptions.push({
      value: normalizedValue,
      label: normalizedValue
    });
  }

  return normalizedOptions;
}

export function CompanyCombobox({
  id,
  value,
  options,
  onChange,
  placeholder,
  className,
  disabled = false
}: CompanyComboboxProps) {
  const { t } = useTranslation('jobs');
  const searchLabels = useSearchComboboxLabels();
  const resolvedPlaceholder = placeholder ?? t('combobox.placeholder');

  const companyOptions = useMemo(
    () => normalizeCompanyOptions([...options, value]),
    [options, value]
  );

  const selectedOption = useMemo<SearchComboboxOption | null>(() => {
    const normalizedValue = normalizeCompanyName(value);
    if (normalizedValue.length === 0) {
      return null;
    }

    const normalizedKey = toCompanyKey(normalizedValue);
    return (
      companyOptions.find(
        (option) => toCompanyKey(option.value) === normalizedKey
      ) ?? {
        value: normalizedValue,
        label: normalizedValue
      }
    );
  }, [companyOptions, value]);

  const handleSearch = useCallback(
    async (query: string): Promise<SearchComboboxOption[]> => {
      const normalizedQuery = normalizeCompanyName(query);
      if (normalizedQuery.length === 0) {
        return [];
      }

      const queryKey = toCompanyKey(normalizedQuery);
      const matches = companyOptions.filter((option) =>
        toCompanyKey(option.label).includes(queryKey)
      );

      const hasExactMatch = matches.some(
        (option) => toCompanyKey(option.value) === queryKey
      );
      if (hasExactMatch) {
        return matches;
      }

      return [
        {
          value: normalizedQuery,
          label: t('combobox.useValue', { value: normalizedQuery })
        },
        ...matches
      ];
    },
    [companyOptions, t]
  );

  return (
    <SearchComboboxField
      id={id}
      inputValue={value}
      selectedOption={selectedOption}
      onInputValueChange={onChange}
      onOptionChange={(option) => onChange(option?.value ?? '')}
      onSearch={handleSearch}
      minLetters={1}
      placeholder={resolvedPlaceholder}
      labels={searchLabels}
      className={className}
      disabled={disabled}
    />
  );
}
