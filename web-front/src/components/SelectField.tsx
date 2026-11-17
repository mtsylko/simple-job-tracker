import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Check, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export type SelectFieldOption = {
  value: string;
  label: string;
};

type SelectFieldProps = {
  options: SelectFieldOption[];
  value: string;
  onChange: (value: string) => void;
  onAddNewOption?: () => void;
  addNewOptionLabel?: string;
  isAddingNewOption?: boolean;
  newOptionValue?: string;
  onNewOptionValueChange?: (value: string) => void;
  onAcceptAddNewOption?: () => void;
  onCancelAddNewOption?: () => void;
  newOptionPlaceholder?: string;
  acceptAddNewOptionLabel?: string;
  cancelAddNewOptionLabel?: string;
  placeholder?: string;
  id?: string;
  className?: string;
  disabled?: boolean;
  size?: 'default' | 'sm';
};

const ADD_NEW_SENTINEL_VALUE = '__select-field-add-new-option__';

export function SelectField({
  options,
  value,
  onChange,
  onAddNewOption,
  addNewOptionLabel = 'Add new',
  isAddingNewOption = false,
  newOptionValue = '',
  onNewOptionValueChange,
  onAcceptAddNewOption,
  onCancelAddNewOption,
  newOptionPlaceholder = 'Type new value',
  acceptAddNewOptionLabel = 'Accept',
  cancelAddNewOptionLabel = 'Cancel',
  placeholder,
  id,
  className,
  disabled,
  size = 'default'
}: SelectFieldProps) {
  if (isAddingNewOption) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Input
          id={id}
          value={newOptionValue}
          onChange={(event) =>
            onNewOptionValueChange?.(event.currentTarget.value)
          }
          onKeyDown={(event) => {
            if (event.key === 'Enter' && onAcceptAddNewOption) {
              event.preventDefault();
              onAcceptAddNewOption();
            }
          }}
          placeholder={newOptionPlaceholder}
          disabled={disabled}
        />
        {onAcceptAddNewOption ? (
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={onAcceptAddNewOption}
            aria-label={acceptAddNewOptionLabel}
            title={acceptAddNewOptionLabel}
            disabled={disabled}
          >
            <Check className="size-3.5" />
          </Button>
        ) : null}
        {onCancelAddNewOption ? (
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={onCancelAddNewOption}
            aria-label={cancelAddNewOptionLabel}
            title={cancelAddNewOptionLabel}
            disabled={disabled}
          >
            <X className="size-3.5" />
          </Button>
        ) : null}
      </div>
    );
  }

  const selectedOption = options.find((option) => option.value === value);

  return (
    <Select
      value={value}
      onValueChange={(nextValue) => {
        if (nextValue === ADD_NEW_SENTINEL_VALUE) {
          onAddNewOption?.();
          return;
        }

        onChange(nextValue ?? '');
      }}
      disabled={disabled}
    >
      <SelectTrigger id={id} size={size} className={cn('w-full', className)}>
        <SelectValue
          placeholder={placeholder}
          className={cn(!selectedOption && 'text-muted-foreground')}
        >
          {selectedOption?.label ?? placeholder ?? ''}
        </SelectValue>
      </SelectTrigger>
      <SelectContent align="start">
        {onAddNewOption ? (
          <>
            <SelectItem value={ADD_NEW_SENTINEL_VALUE}>
              <span className="inline-flex w-3.5 shrink-0 items-center justify-center">
                <Plus className="size-3.5 text-muted-foreground" />
              </span>
              <span>{addNewOptionLabel}</span>
            </SelectItem>
            {options.length > 0 ? <SelectSeparator /> : null}
          </>
        ) : null}
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            <span
              className="inline-flex w-3.5 shrink-0 items-center justify-center"
              aria-hidden="true"
            />
            <span>{option.label}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
