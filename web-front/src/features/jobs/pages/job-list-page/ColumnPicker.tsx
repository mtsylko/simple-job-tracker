import { Columns3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Table } from '@tanstack/react-table';

import { buttonVariants } from '@/components/ui/button-variants';
import { CheckboxField } from '@/components/ui/checkbox-field';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import type { JobRow } from '@/features/jobs/types';
import { cn } from '@/lib/utils';

import { ColumnWidthButtons } from './ColumnWidthButtons';

/** Shows, hides and resizes the columns; `company` is listed locked, for its width buttons. */
export function ColumnPicker({
  table,
  hiddenColumnCount,
  onReset
}: {
  table: Table<JobRow>;
  hiddenColumnCount: number;
  onReset: () => void;
}) {
  const { t } = useTranslation('jobs');
  const listedColumns = table
    .getAllLeafColumns()
    .filter((column) => column.getCanHide() || column.getCanResize());

  return (
    <Popover>
      <PopoverTrigger
        type="button"
        className={cn(buttonVariants({ variant: 'outline' }), 'gap-1.5')}
      >
        <Columns3 className="size-3.5" aria-hidden="true" />
        {t('list.columns.button')}
        {hiddenColumnCount > 0 && (
          <span className="num text-2xs text-muted-foreground">
            {t('list.columns.hiddenCount', { count: hiddenColumnCount })}
          </span>
        )}
      </PopoverTrigger>

      <PopoverContent align="start" className="gap-2">
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs font-medium text-ink-3">
            {t('list.columns.title')}
          </span>
          <button
            type="button"
            onClick={onReset}
            className="cursor-pointer text-xs text-primary underline-offset-4 hover:underline"
          >
            {t('list.columns.reset')}
          </button>
        </div>

        <div className="flex flex-col">
          {listedColumns.map((column) => {
            const label = String(column.columnDef.header);
            return (
              <div
                key={column.id}
                className="flex items-center justify-between gap-3"
              >
                <CheckboxField
                  id={`job-column-${column.id}`}
                  label={label}
                  checked={column.getIsVisible()}
                  disabled={!column.getCanHide()}
                  onCheckedChange={(checked) =>
                    column.toggleVisibility(checked)
                  }
                />
                {column.getCanResize() && (
                  <ColumnWidthButtons
                    table={table}
                    column={column}
                    label={label}
                  />
                )}
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
