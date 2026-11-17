import { X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  SelectField,
  type SelectFieldOption
} from '@/components/ui/select-field';
import { cn } from '@/lib/utils';

type FilterSelectFieldProps = {
  id: string;
  options: SelectFieldOption[];
  value: string;
  onChange: (value: string) => void;
  clearLabel: string;
};

/**
 * A filter select that can be reset without opening the menu: while a value is
 * set, a clear button sits next to the chevron, matching the date pickers in the
 * same popover. Empty is the neutral "All …" state, so the button hides then.
 */
export function FilterSelectField({
  id,
  options,
  value,
  onChange,
  clearLabel
}: FilterSelectFieldProps) {
  const isSet = Boolean(value);

  return (
    <div className="relative">
      <SelectField
        id={id}
        options={options}
        value={value}
        onChange={onChange}
        // Keep the value from running under the clear button while it shows.
        className={cn(isSet && '[&_[data-slot=select-value]]:pr-8')}
      />
      {isSet ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => onChange('')}
          aria-label={clearLabel}
          className="absolute top-1/2 right-7 -translate-y-1/2 text-muted-foreground"
        >
          <X className="size-3.5" aria-hidden="true" />
        </Button>
      ) : null}
    </div>
  );
}
