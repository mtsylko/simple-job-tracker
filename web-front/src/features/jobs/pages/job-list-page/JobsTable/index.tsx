import { useTranslation } from 'react-i18next';
import type { Table } from '@tanstack/react-table';

import type { JobRow } from '@/features/jobs/types';
import { useInfiniteScrollBatches } from '@/hooks/use-infinite-scroll-batches';
import { cn } from '@/lib/utils';
import { EmptyResult } from '../EmptyResult.tsx';
import { JobsTableHeaderCell } from './JobsTableHeaderCell.tsx';
import { JobsTableRow } from './JobsTableRow.tsx';

/** Rows revealed per batch as the list is scrolled. */
const SCROLL_BATCH_SIZE = 50;

/**
 * The rendering half of the jobs list: a semantic table driven by a TanStack
 * instance the page owns. `border-separate` keeps the header's bottom border
 * painted while it is stuck; `border-collapse` drops it on scroll.
 *
 * The table keeps every matching row in its model and this component reveals
 * them a batch at a time, so filter counts and CSV export still see the whole
 * result set.
 */
export function JobsTable({ table }: { table: Table<JobRow> }) {
  const { t } = useTranslation('jobs');

  // A company with a single application is shown as that application rather
  // than as a group of one — a collapsed header hiding one row is all cost and
  // no benefit, and most companies here have exactly one application.
  const rows = table
    .getRowModel()
    .rows.map((row) =>
      row.getIsGrouped() && row.subRows.length === 1 ? row.subRows[0] : row
    );
  // The menu pins directly after the company column, so its offset moves with
  // whatever that column has been resized to.
  const companyWidth = table.getColumn('company')?.getSize() ?? 0;

  const { sentinelRef, visibleCount, hasMore } = useInfiniteScrollBatches({
    enabled: true,
    totalCount: rows.length,
    batchSize: SCROLL_BATCH_SIZE
  });

  const visibleRows = rows.slice(0, visibleCount);

  const isEmpty = rows.length === 0;

  return (
    // Fills the page whatever the row count, so filtering never shifts the layout; pb-12 lets the last row scroll clear of the feedback launcher.
    <div
      className={cn(
        'min-h-0 flex-1 overflow-auto rounded-xl border border-warm-line bg-warm-surface pb-12',
        isEmpty && 'flex flex-col'
      )}
    >
      <table
        className="table-fixed border-separate border-spacing-0 text-sm"
        style={{ width: table.getTotalSize(), minWidth: '100%' }}
      >
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <JobsTableHeaderCell
                  key={header.id}
                  header={header}
                  companyWidth={companyWidth}
                />
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {visibleRows.map((row) => (
            <JobsTableRow key={row.id} row={row} companyWidth={companyWidth} />
          ))}
        </tbody>
      </table>

      {isEmpty && (
        <EmptyResult className="flex flex-1 flex-col justify-center" />
      )}

      {hasMore && (
        // Sticky so the count stays put while the next batch is fetched into
        // view, rather than sliding off to the right on a wide table.
        <div ref={sentinelRef} className="sticky left-0 py-3 text-center">
          <span className="num text-xs text-muted-foreground">
            {t('list.table.loadedCount', {
              count: visibleCount,
              total: rows.length
            })}
          </span>
        </div>
      )}
    </div>
  );
}
