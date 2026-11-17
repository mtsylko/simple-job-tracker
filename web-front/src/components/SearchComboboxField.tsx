import { useEffect, useMemo, useState } from 'react';

import {
  Combobox,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList
} from '@/components/ui/combobox';
import { cn } from '@/lib/utils';

export type SearchComboboxOption = {
  value: string;
  label: string;
  payload?: unknown;
};

type SearchComboboxFieldProps = {
  id?: string;
  inputValue: string;
  selectedOption: SearchComboboxOption | null;
  onInputValueChange: (value: string) => void;
  onOptionChange: (option: SearchComboboxOption | null) => void;
  onSearch: (query: string) => Promise<SearchComboboxOption[]>;
  onSearchResults?: (options: SearchComboboxOption[]) => void;
  minLetters?: number;
  debounceMs?: number;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
};

const SEARCH_INPUT_REASONS = new Set([
  'input-change',
  'input-paste',
  'input-clear',
  'clear-press'
]);

function countLetters(value: string): number {
  return Array.from(value).filter((character) => /\p{L}/u.test(character))
    .length;
}

function readErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return 'Search failed';
}

export function SearchComboboxField({
  id,
  inputValue,
  selectedOption,
  onInputValueChange,
  onOptionChange,
  onSearch,
  onSearchResults,
  minLetters = 3,
  debounceMs = 300,
  placeholder = 'Type to search',
  className,
  disabled = false
}: SearchComboboxFieldProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchComboboxOption[]>(
    []
  );
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const query = searchTerm.trim();
    if (countLetters(query) < minLetters) {
      return;
    }

    let isCurrent = true;

    const timeoutId = window.setTimeout(async () => {
      try {
        const options = await onSearch(query);
        if (!isCurrent) {
          return;
        }

        setSearchResults(options);
        onSearchResults?.(options);
      } catch (error) {
        if (!isCurrent) {
          return;
        }

        setSearchResults([]);
        setSearchError(readErrorMessage(error));
      } finally {
        if (isCurrent) {
          setIsLoading(false);
        }
      }
    }, debounceMs);

    return () => {
      isCurrent = false;
      window.clearTimeout(timeoutId);
    };
  }, [debounceMs, minLetters, onSearch, onSearchResults, searchTerm]);

  const items = useMemo(() => {
    if (!selectedOption) {
      return searchResults;
    }

    if (searchResults.some((option) => option.value === selectedOption.value)) {
      return searchResults;
    }

    return [selectedOption, ...searchResults];
  }, [searchResults, selectedOption]);

  const emptyMessage = useMemo(() => {
    if (isLoading) {
      return 'Searching...';
    }

    if (searchError) {
      return searchError;
    }

    if (countLetters(searchTerm.trim()) < minLetters) {
      return `Type at least ${minLetters} letters to search`;
    }

    return 'No results found';
  }, [isLoading, minLetters, searchError, searchTerm]);

  return (
    <Combobox
      items={items}
      value={selectedOption}
      inputValue={inputValue}
      disabled={disabled}
      itemToStringLabel={(option) => option.label}
      itemToStringValue={(option) => option.value}
      isItemEqualToValue={(item, value) => item.value === value.value}
      onValueChange={onOptionChange}
      onInputValueChange={(nextValue, eventDetails) => {
        onInputValueChange(nextValue);

        if (!SEARCH_INPUT_REASONS.has(eventDetails.reason)) {
          return;
        }

        setSearchTerm(nextValue);

        if (countLetters(nextValue.trim()) < minLetters) {
          setSearchResults([]);
          setSearchError(null);
          setIsLoading(false);
        } else {
          setSearchError(null);
          setIsLoading(true);
        }
      }}
    >
      <ComboboxInput
        id={id}
        placeholder={placeholder}
        className={cn('w-full', className)}
        showClear
        disabled={disabled}
      />
      <ComboboxContent align="start">
        <ComboboxList>
          <ComboboxCollection>
            {(option: SearchComboboxOption) => (
              <ComboboxItem key={option.value} value={option}>
                {option.label}
              </ComboboxItem>
            )}
          </ComboboxCollection>
        </ComboboxList>
        <ComboboxEmpty>{emptyMessage}</ComboboxEmpty>
      </ComboboxContent>
    </Combobox>
  );
}
