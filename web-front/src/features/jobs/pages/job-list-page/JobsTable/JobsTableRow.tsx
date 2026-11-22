import { flexRender, type Row } from '@tanstack/react-table';

import type { JobRow } from '@/features/jobs/types';
import { rowOpenHandlers, ROW_OPEN_CLASS } from '@/lib/row-open';
import { cn } from '@/lib/utils';
import { GroupHeaderCell } from '../TableCells/GroupHeaderCell.tsx';
import { useGroupLabel } from '../use-group-label';
import {
  PINNED_START_COLUMN_ID,
  SELECT_COLUMN_ID,
  pinnedCellClass,
  pinnedCellStyle
} from './column-pinning';

export function JobsTableRow({
  row,
  companyWidth
}: {
  row: Row<JobRow>;
  companyWidth: number;
}) {
  const groupLabel = useGroupLabel();
  const isGroupHeader = row.getIsGrouped();

  return (
    <tr
      // A group header only folds; every other row opens through its title link
      {...(isGroupHeader ? {} : rowOpenHandlers)}
      className={cn(
        'h-14 bg-warm-surface hover:bg-row-hover',
        !isGroupHeader && ROW_OPEN_CLASS
      )}
    >
      {row.getVisibleCells().map((cell) => {
        const columnId = cell.column.id;

        return (
          <td
            key={cell.id}
            style={{
              width: cell.column.getSize(),
              ...pinnedCellStyle(columnId, companyWidth)
            }}
            className={cn(
              // Clipped rather than wrapped: a long note must not push the row
              // taller than its neighbours. Stacked cells (company, salary) use
              // block children, which `nowrap` leaves alone.
              'h-14 overflow-hidden border-b border-warm-line bg-inherit px-3.5 align-middle text-ellipsis whitespace-nowrap',
              pinnedCellClass(columnId),
              columnId === SELECT_COLUMN_ID && 'px-0'
            )}
          >
            {/* The group header always occupies the first column, whichever
                column was grouped by — reading it off the left edge beats
                hunting for it in whatever column happens to be grouped. Every
                other cell on a group row is an aggregate that means nothing
                here, so it renders empty. */}
            {isGroupHeader ? (
              columnId === PINNED_START_COLUMN_ID ? (
                <GroupHeaderCell
                  label={groupLabel(
                    row.groupingColumnId ?? '',
                    row.groupingValue
                  )}
                  count={row.subRows.length}
                  isExpanded={row.getIsExpanded()}
                  onToggle={() => row.toggleExpanded()}
                />
              ) : null
            ) : (
              flexRender(cell.column.columnDef.cell, cell.getContext())
            )}
          </td>
        );
      })}
    </tr>
  );
}
