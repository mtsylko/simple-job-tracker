import type { ComponentProps } from 'react';

import { DatePicker } from '@/components/ui/date-picker';
import { useDateLocale } from '@/lib/date-locale';

/** The vendored DatePicker with its calendar in the UI language. */
export function LocalizedDatePicker({
  calendarProps,
  ...props
}: ComponentProps<typeof DatePicker>) {
  const locale = useDateLocale();

  return <DatePicker {...props} calendarProps={{ locale, ...calendarProps }} />;
}
