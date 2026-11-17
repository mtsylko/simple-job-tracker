import { useState } from 'react';
import { Check, ListTree } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Table } from '@tanstack/react-table';

import { buttonVariants } from '@/components/ui/button-variants';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import type { JobRow } from '@/features/jobs/types';
import { cn } from '@/lib/utils';

/** Sentinel for "no grouping" — an empty grouping state has no option to match. */
const NO_GROUPING = '__none__';

/**
 * Picks the column the list groups by. The options come from the columns
 * themselves, so a column opts in with `enableGrouping` rather than by being
 * listed again here.
 *
 * A popover rather than a select: it sits beside the column picker and reads as
 * its pair, where a labelled select spelling out "Group by: Nothing" did not.
 */
export function GroupByPicker({ table }: { table: Table<JobRow> }) {
  const { t } = useTranslation('jobs');
  const [isOpen, setIsOpen] = useState(false);

  const groupableColumns = table
    .getAllLeafColumns()
    .filter((column) => column.getCanGroup());

  const [groupedColumnId] = table.getState().grouping;

  const options = [
    { value: NO_GROUPING, label: t('list.grouping.none') },
    ...groupableColumns.map((column) => ({
      value: column.id,
      label: String(column.columnDef.header)
    }))
  ];

  const selectedValue = groupedColumnId ?? NO_GROUPING;
  const activeLabel = groupedColumnId
    ? options.find((option) => option.value === groupedColumnId)?.label
    : undefined;

  function selectGrouping(value: string) {
    // Groups from the previous column mean nothing under the new one, so the
    // list always reopens collapsed.
    table.resetExpanded();
    table.setGrouping(value === NO_GROUPING ? [] : [value]);
    setIsOpen(false);
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger
        type="button"
        className={cn(buttonVariants({ variant: 'outline' }), 'gap-1.5')}
      >
        <ListTree className="size-3.5" aria-hidden="true" />
        {t('list.grouping.label')}
        {activeLabel && (
          <span className="rounded-full bg-primary/10 px-1.5 text-2xs text-primary">
            {activeLabel}
          </span>
        )}
      </PopoverTrigger>

      <PopoverContent align="start" className="w-44 gap-0 p-1">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => selectGrouping(option.value)}
            className="flex min-h-7 cursor-pointer items-center gap-2 rounded-sm px-2 text-left text-xs/relaxed hover:bg-accent hover:text-accent-foreground"
          >
            <Check
              className={cn(
                'size-3.5 shrink-0',
                option.value !== selectedValue && 'invisible'
              )}
              aria-hidden="true"
            />
            {option.label}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
