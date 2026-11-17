import type { Column, Table } from '@tanstack/react-table';

/** One arrow press on a resize handle, or one click of a width button. */
export const COLUMN_RESIZE_STEP = 20;

/** Shift + arrow moves this many steps at once. */
export const COLUMN_RESIZE_SHIFT_STEPS = 5;

/** Clamped to the column's own bounds, as a drag is. */
export function setColumnWidth<T>(
  table: Table<T>,
  column: Column<T, unknown>,
  width: number
): void {
  const { minSize = 0, maxSize = Number.MAX_SAFE_INTEGER } = column.columnDef;
  const next = Math.round(Math.min(maxSize, Math.max(minSize, width)));
  table.setColumnSizing((old) => ({ ...old, [column.id]: next }));
}

export function resizeColumnBy<T>(
  table: Table<T>,
  column: Column<T, unknown>,
  delta: number
): void {
  setColumnWidth(table, column, column.getSize() + delta);
}
