import * as React from 'react';

import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

type CheckboxFieldProps = {
  id: string;
  label: React.ReactNode;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  checkboxClassName?: string;
};

function CheckboxField({
  id,
  label,
  checked,
  onCheckedChange,
  disabled = false,
  className,
  checkboxClassName
}: CheckboxFieldProps) {
  return (
    <label
      htmlFor={id}
      data-slot="checkbox-field"
      className={cn(
        'flex h-8 cursor-pointer items-center gap-1.5 text-sm text-foreground',
        disabled && 'cursor-not-allowed opacity-50',
        className
      )}
    >
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(nextChecked) => onCheckedChange(nextChecked === true)}
        disabled={disabled}
        className={checkboxClassName}
      />
      <span>{label}</span>
    </label>
  );
}

export { CheckboxField, type CheckboxFieldProps };
