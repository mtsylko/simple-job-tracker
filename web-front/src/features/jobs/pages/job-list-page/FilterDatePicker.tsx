import { X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { LocalizedDatePicker } from '@/components/LocalizedDatePicker';

type FilterDatePickerProps = {
  id: string;
  value: string;
  onValueChange: (value: string) => void;
  displayFormat: string;
  placeholder: string;
  clearLabel: string;
};

/**
 * A filter date picker that can be reset without opening the calendar: while a
 * date is set, a clear button sits next to the calendar icon, matching the
 * selects in the same popover. Composes the vendored DatePicker rather than
 * editing it; clearing the value lets the picker resync its own input.
 */
export function FilterDatePicker({
  id,
  value,
  onValueChange,
  displayFormat,
  placeholder,
  clearLabel
}: FilterDatePickerProps) {
  const isSet = Boolean(value);

  return (
    <div className="relative">
      <LocalizedDatePicker
        id={id}
        value={value}
        onValueChange={onValueChange}
        displayFormat={displayFormat}
        placeholder={placeholder}
      />
      {isSet ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => onValueChange('')}
          aria-label={clearLabel}
          className="absolute top-1/2 right-7 -translate-y-1/2 text-muted-foreground"
        >
          <X className="size-3.5" aria-hidden="true" />
        </Button>
      ) : null}
    </div>
  );
}
