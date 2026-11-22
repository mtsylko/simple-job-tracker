import { useId, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { flexRender, type Header } from '@tanstack/react-table';

import type { JobRow } from '@/features/jobs/types';
import { cn } from '@/lib/utils';
import { SortIndicator } from '../SortIndicator.tsx';
import {
  SELECT_COLUMN_ID,
  pinnedCellClass,
  pinnedCellStyle
} from './column-pinning';
import {
  COLUMN_RESIZE_SHIFT_STEPS,
  COLUMN_RESIZE_STEP,
  resizeColumnBy
} from './column-sizing';

export function JobsTableHeaderCell({
  header,
  companyWidth
}: {
  header: Header<JobRow, unknown>;
  companyWidth: number;
}) {
  const { t } = useTranslation('jobs');
  const { column } = header;
  const label = flexRender(column.columnDef.header, header.getContext());
  const width = header.getSize();
  const labelId = useId();

  const handleResizeKey = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = event.shiftKey
      ? COLUMN_RESIZE_STEP * COLUMN_RESIZE_SHIFT_STEPS
      : COLUMN_RESIZE_STEP;
    if (event.key === 'ArrowLeft') {
      resizeColumnBy(header.getContext().table, column, -step);
    } else if (event.key === 'ArrowRight') {
      resizeColumnBy(header.getContext().table, column, step);
    } else {
      return;
    }
    // Otherwise the arrow also scrolls the table sideways.
    event.preventDefault();
  };

  return (
    <th
      scope="col"
      // Only the sorted column carries it; the arrow icon is aria-hidden.
      aria-sort={
        column.getIsSorted() === 'asc'
          ? 'ascending'
          : column.getIsSorted() === 'desc'
            ? 'descending'
            : undefined
      }
      style={{
        width,
        ...pinnedCellStyle(column.id, companyWidth)
      }}
      className={cn(
        // Sentence case: tracked capitals read louder than the data under them.
        'sticky top-0 z-20 h-10 border-b border-warm-line bg-warm-surface px-3.5 text-left text-xs font-medium text-ink-3',
        pinnedCellClass(column.id, true),
        column.id === SELECT_COLUMN_ID && 'px-0'
      )}
      // Named by its label alone; the resize handle's width would join it otherwise.
      aria-labelledby={labelId}
    >
      {column.getCanSort() ? (
        <button
          type="button"
          onClick={column.getToggleSortingHandler()}
          className={cn(
            // Without an explicit ring the browser's default outline shows up
            // as a hard box around the label after a click.
            'flex w-full cursor-pointer items-center rounded-sm outline-none transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-ring/30',
            column.getIsSorted() && 'text-clay-ink'
          )}
        >
          <span id={labelId} className="truncate">
            {label}
          </span>
          <SortIndicator direction={column.getIsSorted()} />
        </button>
      ) : (
        <span id={labelId}>{label}</span>
      )}

      {column.getCanResize() && (
        // Arrows resize it; the Columns menu does the same without a drag.
        <div
          role="separator"
          tabIndex={0}
          aria-orientation="vertical"
          aria-label={t('list.table.resizeColumn', {
            column: String(column.columnDef.header)
          })}
          aria-valuenow={width}
          aria-valuemin={column.columnDef.minSize}
          aria-valuemax={column.columnDef.maxSize}
          aria-valuetext={t('list.table.columnWidth', { width })}
          onMouseDown={header.getResizeHandler()}
          onTouchStart={header.getResizeHandler()}
          onDoubleClick={() => column.resetSize()}
          onKeyDown={handleResizeKey}
          className={cn(
            'absolute inset-y-0 right-0 w-1 cursor-col-resize touch-none select-none outline-none hover:bg-clay/40 focus-visible:bg-clay',
            column.getIsResizing() && 'bg-clay/60'
          )}
        />
      )}
    </th>
  );
}
