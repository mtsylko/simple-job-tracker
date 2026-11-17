import * as React from 'react';
import { format, isValid, parse } from 'date-fns';
import { CalendarDays } from 'lucide-react';

import { buttonVariants } from '@/components/ui/button-variants';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const DEFAULT_DATE_VALUE_FORMAT = 'yyyy-MM-dd';
const DEFAULT_DATE_DISPLAY_FORMAT = 'dd/MM/yyyy';
const DEFAULT_DATE_DISPLAY_INPUT_MAX_LENGTH = 10;
const DEFAULT_DATE_DISPLAY_DIGIT_COUNT = 8;
const DEFAULT_DATE_DISPLAY_DIGIT_POSITIONS = [0, 1, 3, 4, 6, 7, 8, 9] as const;

function parseDateValue(value: string, valueFormat: string): Date | undefined {
  if (!value) {
    return undefined;
  }

  const parsedDate = parse(value, valueFormat, new Date());
  if (!isValid(parsedDate)) {
    return undefined;
  }

  return format(parsedDate, valueFormat) === value ? parsedDate : undefined;
}

function formatDateDisplayInput(value: string, displayFormat: string): string {
  if (displayFormat !== DEFAULT_DATE_DISPLAY_FORMAT) {
    return value;
  }

  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) {
    return digits;
  }

  if (digits.length <= 4) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }

  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function getDateDigitIndexFromCaret(caretPosition: number): number {
  const nextDigitIndex = DEFAULT_DATE_DISPLAY_DIGIT_POSITIONS.findIndex(
    (position) => position >= caretPosition
  );
  return nextDigitIndex === -1
    ? DEFAULT_DATE_DISPLAY_DIGIT_COUNT
    : nextDigitIndex;
}

function getCaretPositionFromDateDigitIndex(
  digitIndex: number,
  currentValue: string
): number {
  if (digitIndex >= DEFAULT_DATE_DISPLAY_DIGIT_COUNT) {
    return currentValue.length;
  }

  return Math.min(
    DEFAULT_DATE_DISPLAY_DIGIT_POSITIONS[digitIndex],
    currentValue.length
  );
}

function replaceDateDisplayDigit(
  value: string,
  digit: string,
  caretPosition: number
): { nextValue: string; nextCaret: number } {
  const digits = value
    .replace(/\D/g, '')
    .slice(0, DEFAULT_DATE_DISPLAY_DIGIT_COUNT)
    .split('');
  const targetDigitIndex = Math.min(
    getDateDigitIndexFromCaret(caretPosition),
    DEFAULT_DATE_DISPLAY_DIGIT_COUNT - 1
  );

  while (digits.length <= targetDigitIndex) {
    digits.push('');
  }

  digits[targetDigitIndex] = digit;

  const nextValue = formatDateDisplayInput(
    digits.join(''),
    DEFAULT_DATE_DISPLAY_FORMAT
  );
  const nextCaret = getCaretPositionFromDateDigitIndex(
    targetDigitIndex + 1,
    nextValue
  );

  return { nextValue, nextCaret };
}

type DatePickerProps = {
  id?: string;
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  valueFormat?: string;
  displayFormat?: string;
  buttonClassName?: string;
  popoverContentClassName?: string;
  calendarProps?: Omit<
    React.ComponentProps<typeof Calendar>,
    'mode' | 'selected' | 'onSelect'
  >;
};

function DatePicker({
  id,
  value,
  onValueChange,
  placeholder = 'Select date',
  disabled = false,
  valueFormat = DEFAULT_DATE_VALUE_FORMAT,
  displayFormat = DEFAULT_DATE_DISPLAY_FORMAT,
  buttonClassName,
  popoverContentClassName,
  calendarProps
}: DatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const selectedDate = parseDateValue(value, valueFormat);
  const formattedManualValue = selectedDate
    ? format(selectedDate, displayFormat)
    : '';
  const [manualValue, setManualValue] = React.useState(formattedManualValue);
  const [syncedFormattedValue, setSyncedFormattedValue] =
    React.useState(formattedManualValue);

  if (formattedManualValue !== syncedFormattedValue) {
    setSyncedFormattedValue(formattedManualValue);
    setManualValue(formattedManualValue);
  }

  function commitManualValue(nextValue: string): boolean {
    const trimmedValue = nextValue.trim();
    if (!trimmedValue) {
      onValueChange('');
      setManualValue('');
      return true;
    }

    const parsedWithValueFormat = parseDateValue(trimmedValue, valueFormat);
    const parsedWithDisplayFormat = parseDateValue(trimmedValue, displayFormat);
    const parsedDate = parsedWithValueFormat ?? parsedWithDisplayFormat;

    if (!parsedDate) {
      return false;
    }

    const normalizedValue = format(parsedDate, valueFormat);
    onValueChange(normalizedValue);
    setManualValue(format(parsedDate, displayFormat));
    return true;
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
          buttonClassName
        )}
      >
        <span
          className={selectedDate ? 'text-foreground' : 'text-muted-foreground'}
        >
          {selectedDate ? format(selectedDate, displayFormat) : placeholder}
        </span>
        <CalendarDays
          className="size-3.5 text-muted-foreground"
          aria-hidden="true"
        />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className={cn('w-auto p-0', popoverContentClassName)}
      >
        <div className="border-b p-2">
          <Input
            value={manualValue}
            onChange={(event) =>
              setManualValue(
                formatDateDisplayInput(event.currentTarget.value, displayFormat)
              )
            }
            onFocus={(event) => {
              const { currentTarget } = event;
              currentTarget.setSelectionRange(0, 0);
            }}
            onBlur={(event) => {
              const nextFocusedElement =
                event.relatedTarget as HTMLElement | null;
              if (nextFocusedElement?.closest('[data-slot="calendar"]')) {
                return;
              }

              const wasCommitted = commitManualValue(event.currentTarget.value);
              if (!wasCommitted) {
                setManualValue(formattedManualValue);
              }
            }}
            onKeyDown={(event) => {
              if (
                displayFormat === DEFAULT_DATE_DISPLAY_FORMAT &&
                /^\d$/.test(event.key)
              ) {
                event.preventDefault();

                const input = event.currentTarget;
                const caretPosition =
                  input.selectionStart ?? input.value.length;
                const { nextValue, nextCaret } = replaceDateDisplayDigit(
                  input.value,
                  event.key,
                  caretPosition
                );
                setManualValue(nextValue);

                requestAnimationFrame(() => {
                  input.setSelectionRange(nextCaret, nextCaret);
                });

                return;
              }

              if (event.key !== 'Enter') {
                return;
              }

              event.preventDefault();

              const wasCommitted = commitManualValue(event.currentTarget.value);
              if (wasCommitted) {
                setIsOpen(false);
                return;
              }

              setManualValue(formattedManualValue);
            }}
            placeholder={displayFormat}
            inputMode={
              displayFormat === DEFAULT_DATE_DISPLAY_FORMAT
                ? 'numeric'
                : undefined
            }
            maxLength={
              displayFormat === DEFAULT_DATE_DISPLAY_FORMAT
                ? DEFAULT_DATE_DISPLAY_INPUT_MAX_LENGTH
                : undefined
            }
            autoComplete="off"
            autoFocus
          />
        </div>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => {
            if (!date) {
              return;
            }

            onValueChange(format(date, valueFormat));
            setManualValue(format(date, displayFormat));
            setIsOpen(false);
          }}
          {...calendarProps}
        />
      </PopoverContent>
    </Popover>
  );
}

export { DatePicker };
