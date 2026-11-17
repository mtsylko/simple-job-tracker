import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin } from 'lucide-react';

import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import {
  SearchComboboxField,
  type SearchComboboxOption
} from '@/components/ui/search-combobox-field';
import { suggestLocations } from '@/features/jobs/job-api';
import { useSearchComboboxLabels } from '@/lib/ui-labels';

type LocationFieldProps = {
  id?: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
};

/**
 * The optional Location form field: a free-text input with "City, Country"
 * suggestions from the geocoding proxy. The typed value is always kept, so an
 * entry that matches no suggestion (or arrives while the service is down) saves.
 */
export function LocationField({
  id = 'job-location',
  value,
  error,
  onChange
}: LocationFieldProps) {
  const { t } = useTranslation('jobs');
  const searchLabels = useSearchComboboxLabels();

  const selectedOption = useMemo<SearchComboboxOption | null>(() => {
    return value.trim().length > 0 ? { value, label: value } : null;
  }, [value]);

  const handleSearch = useCallback(
    async (query: string): Promise<SearchComboboxOption[]> => {
      const suggestions = await suggestLocations(query);
      return suggestions.map((suggestion) => ({
        value: suggestion,
        label: suggestion
      }));
    },
    []
  );

  return (
    <Field className="gap-1">
      <FieldLabel htmlFor={id}>{t('form.fields.location')}</FieldLabel>
      <div className="relative">
        <MapPin
          className="pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <SearchComboboxField
          id={id}
          inputValue={value}
          selectedOption={selectedOption}
          onInputValueChange={onChange}
          onOptionChange={(option) => onChange(option?.value ?? '')}
          onSearch={handleSearch}
          placeholder={t('form.placeholders.location')}
          labels={searchLabels}
          className="[&_[data-slot=input-group-control]]:pl-9"
        />
      </div>
      <FieldError>{error}</FieldError>
    </Field>
  );
}
