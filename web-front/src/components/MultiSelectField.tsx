import { Check, ChevronsUpDown } from 'lucide-react';
import { useMemo, useState } from 'react';

import { buttonVariants } from '@/components/ui/button-variants';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export type MultiSelectFieldOption = {
  value: string;
  label: string;
};

type MultiSelectFieldProps = {
  options: MultiSelectFieldOption[];
  values: string[];
  onChange: (nextValues: string[]) => void;
  placeholder?: string;
  id?: string;
  className?: string;
  disabled?: boolean;
  maxVisibleLabels?: number;
};

export function MultiSelectField({
  options,
  values,
  onChange,
  placeholder = 'Select options',
  id,
  className,
  disabled = false,
  maxVisibleLabels = 2
}: MultiSelectFieldProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedLabels = useMemo(() => {
    return options
      .filter((option) => values.includes(option.value))
      .map((option) => option.label);
  }, [options, values]);

  const triggerLabel = useMemo(() => {
    if (selectedLabels.length === 0) {
      return placeholder;
    }

    if (selectedLabels.length <= maxVisibleLabels) {
      return selectedLabels.join(', ');
    }

    return `${selectedLabels.length} selected`;
  }, [maxVisibleLabels, placeholder, selectedLabels]);

  function toggleValue(nextValue: string) {
    if (values.includes(nextValue)) {
      onChange(values.filter((value) => value !== nextValue));
      return;
    }

    onChange([...values, nextValue]);
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger
        id={id}
        type="button"
        disabled={disabled}
        className={cn(
          buttonVariants({ variant: 'outline' }),
          'h-8 w-full justify-between bg-background px-2 text-left font-normal hover:bg-background',
          className
        )}
      >
        <span
          className={cn(
            'truncate',
            selectedLabels.length === 0 && 'text-muted-foreground'
          )}
        >
          {triggerLabel}
        </span>
        <ChevronsUpDown
          className="size-3.5 text-muted-foreground"
          aria-hidden="true"
        />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-1">
        <div className="max-h-64 overflow-y-auto">
          {options.length === 0 ? (
            <p className="px-2 py-1.5 text-xs text-muted-foreground">
              No options available.
            </p>
          ) : (
            options.map((option) => {
              const selected = values.includes(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => toggleValue(option.value)}
                  className={cn(
                    'flex min-h-7 w-full items-center gap-2 rounded-md px-2 py-1 text-left text-xs outline-none transition-colors',
                    selected
                      ? 'bg-accent text-accent-foreground'
                      : 'hover:bg-accent/70'
                  )}
                >
                  <span className="inline-flex w-4 items-center justify-center">
                    {selected ? (
                      <Check className="size-3.5" aria-hidden="true" />
                    ) : null}
                  </span>
                  <span className="truncate">{option.label}</span>
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
