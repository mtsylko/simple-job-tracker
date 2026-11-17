import { Minus, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Column, Table } from '@tanstack/react-table';

import { Button } from '@/components/ui/button';
import type { JobRow } from '@/features/jobs/types';

import { COLUMN_RESIZE_STEP, resizeColumnBy } from './JobsTable/column-sizing';

/** Resizes a column by clicks, for anyone who cannot drag the header handle. */
export function ColumnWidthButtons({
  table,
  column,
  label
}: {
  table: Table<JobRow>;
  column: Column<JobRow, unknown>;
  label: string;
}) {
  const { t } = useTranslation('jobs');
  const width = column.getSize();
  const { minSize = 0, maxSize = Number.MAX_SAFE_INTEGER } = column.columnDef;
  const isHidden = !column.getIsVisible();

  return (
    <div className="flex shrink-0 items-center">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="text-muted-foreground"
        aria-label={t('list.columns.narrower', { column: label })}
        disabled={isHidden || width <= minSize}
        onClick={() => resizeColumnBy(table, column, -COLUMN_RESIZE_STEP)}
      >
        <Minus aria-hidden="true" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="text-muted-foreground"
        aria-label={t('list.columns.wider', { column: label })}
        disabled={isHidden || width >= maxSize}
        onClick={() => resizeColumnBy(table, column, COLUMN_RESIZE_STEP)}
      >
        <Plus aria-hidden="true" />
      </Button>
    </div>
  );
}
