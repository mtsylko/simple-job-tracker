import { useEffect, useRef } from 'react';
import { Check, Plus, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

type SelectFieldOption = {
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

function SelectField({
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
  const addNewContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isAddingNewOption) {
      return;
    }

    const animationFrameId = requestAnimationFrame(() => {
      addNewContainerRef.current?.querySelector('input')?.focus();
    });

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isAddingNewOption]);

  if (isAddingNewOption) {
    return (
      <div
        ref={addNewContainerRef}
        className={cn('flex items-center gap-2', className)}
        onBlurCapture={(event) => {
          const nextFocusedElement = event.relatedTarget;
          if (
            nextFocusedElement instanceof Node &&
            event.currentTarget.contains(nextFocusedElement)
          ) {
            return;
          }

          onCancelAddNewOption?.();
        }}
      >
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
            variant="ghost"
            size="icon-sm"
            className="cursor-pointer"
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
            variant="ghost"
            size="icon-sm"
            className="cursor-pointer"
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
      {/* `pr-7` reserves the gutter the tick is absolutely positioned into.
          The popup is `w-max`, so this widens it to fit rather than letting a
          long label run underneath the tick.

          The leading spacer exists only to align labels with the "Add new"
          row's icon, so without that row it is dead indent. */}
      <SelectContent align="start">
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value} className="pr-7">
            {onAddNewOption ? (
              <span className="inline-flex w-3.5 shrink-0" aria-hidden="true" />
            ) : null}
            <span>{option.label}</span>
          </SelectItem>
        ))}
        {onAddNewOption ? (
          <>
            {options.length > 0 ? (
              <SelectSeparator className="mt-0 mb-0" />
            ) : null}
            <SelectItem value={ADD_NEW_SENTINEL_VALUE} className="pr-7">
              <span className="inline-flex w-3.5 shrink-0 items-center justify-center">
                <Plus className="size-3.5 text-muted-foreground" />
              </span>
              <span>{addNewOptionLabel}</span>
            </SelectItem>
          </>
        ) : null}
      </SelectContent>
    </Select>
  );
}

export { SelectField, type SelectFieldOption };
