import { useMemo, useState } from 'react';

import { cn } from '@/lib/utils.ts';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table.tsx';
import { InfiniteScrollStatus } from './InfiniteScrollStatus.tsx';
import { PaginatedTableFooter } from './PaginatedTableFooter.tsx';
import { PaginationControls } from './PaginationControls.tsx';
import { PaginationType } from './types.ts';
import type { PaginatedTableColumn, PaginatedTableProps } from './types.ts';
import { useInfiniteScrollBatches } from '@/hooks/use-infinite-scroll-batches.ts';

function getAlignClass<T>(column: PaginatedTableColumn<T>): string {
  switch (column.align ?? 'left') {
    case 'center':
      return 'text-center';
    case 'right':
      return 'text-right';
    default:
      return 'text-left';
  }
}

export function PaginatedTable<T extends Record<string, unknown>>({
  data,
  columns,
  getRowId,
  onRowClick,
  getRowClassName,
  pageSize = 5,
  emptyMessage = 'No records found',
  itemLabel = 'records',
  className,
  tableClassName,
  paginationType = PaginationType.Pagination,
  infiniteScrollBatchSize
}: PaginatedTableProps<T>) {
  const isInfiniteScroll = paginationType === PaginationType.InfiniteScroll;
  const [page, setPage] = useState(1);

  const { sentinelRef, visibleCount, hasMore } = useInfiniteScrollBatches({
    enabled: isInfiniteScroll,
    totalCount: data.length,
    batchSize: Math.max(1, infiniteScrollBatchSize ?? pageSize)
  });

  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const fromIndex = (safePage - 1) * pageSize;

  const pageRows = useMemo(
    () =>
      isInfiniteScroll
        ? data.slice(0, visibleCount)
        : data.slice(fromIndex, fromIndex + pageSize),
    [data, fromIndex, isInfiniteScroll, pageSize, visibleCount]
  );

  // Index of the first visible row within `data`; infinite scroll always
  // renders from the top, so visible rows and data indexes line up there.
  const rowOffset = isInfiniteScroll ? 0 : fromIndex;
  const fromLabel = data.length === 0 ? 0 : rowOffset + 1;
  const toLabel = rowOffset + pageRows.length;

  return (
    <div
      className={cn(
        'overflow-hidden rounded-lg border bg-card text-left shadow-sm',
        className
      )}
    >
      <Table className={tableClassName}>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead
                key={String(column.id)}
                className={cn(getAlignClass(column), column.className)}
              >
                {column.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {pageRows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="py-6 text-center text-muted-foreground"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            pageRows.map((row, index) => {
              const rowIndex = rowOffset + index;

              return (
                <TableRow
                  key={getRowId(row, rowIndex)}
                  className={cn(
                    onRowClick ? 'cursor-pointer' : undefined,
                    getRowClassName?.(row, rowIndex)
                  )}
                  tabIndex={onRowClick ? 0 : undefined}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  onKeyDown={
                    onRowClick
                      ? (event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            onRowClick(row);
                          }
                        }
                      : undefined
                  }
                >
                  {columns.map((column) => (
                    <TableCell
                      key={String(column.id)}
                      className={cn(getAlignClass(column), column.className)}
                    >
                      {column.cell
                        ? column.cell(row, rowIndex)
                        : String(row[column.id as keyof T] ?? '')}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
      {hasMore ? <div ref={sentinelRef} className="h-3 w-full" /> : null}

      <PaginatedTableFooter
        fromLabel={fromLabel}
        toLabel={toLabel}
        totalCount={data.length}
        itemLabel={itemLabel}
      >
        {isInfiniteScroll ? (
          <InfiniteScrollStatus hasMore={hasMore} />
        ) : (
          <PaginationControls
            page={safePage}
            totalPages={totalPages}
            onPrevious={() => setPage((prev) => Math.max(1, prev - 1))}
            onNext={() => setPage((prev) => Math.min(totalPages, prev + 1))}
          />
        )}
      </PaginatedTableFooter>
    </div>
  );
}
