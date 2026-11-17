import type { ReactNode } from 'react';

export type PaginatedTableColumnAlignment = 'left' | 'center' | 'right';

export type PaginatedTableColumn<T> = {
  id: keyof T | string;
  label: string;
  align?: PaginatedTableColumnAlignment;
  className?: string;
  cell?: (row: T, index: number) => ReactNode;
};

export enum PaginationType {
  Pagination = 'pagination',
  InfiniteScroll = 'infinite-scroll'
}

export type PaginatedTableProps<T> = {
  data: ReadonlyArray<T>;
  columns: ReadonlyArray<PaginatedTableColumn<T>>;
  getRowId: (row: T, index: number) => string;
  onRowClick?: (row: T) => void;
  getRowClassName?: (row: T, index: number) => string | undefined;
  pageSize?: number;
  emptyMessage?: string;
  itemLabel?: string;
  className?: string;
  tableClassName?: string;
  paginationType?: PaginationType;
  infiniteScrollBatchSize?: number;
};
