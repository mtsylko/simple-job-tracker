import type { CSSProperties } from 'react';

/**
 * The columns that stay put while the rest scroll sideways: the row's
 * checkbox, its title and, beside it, its menu. All pin to the inline start,
 * which is where react-data-grid put them — it sorted every `frozen` column to
 * the front.
 */
export const SELECT_COLUMN_ID = 'select';
export const PINNED_START_COLUMN_ID = 'company';
export const PINNED_END_COLUMN_ID = 'actions';

/** Fixed, so the company column can pin at a known offset after it. */
export const SELECT_COLUMN_WIDTH = 44;

const PINNED_COLUMN_IDS: readonly string[] = [
  SELECT_COLUMN_ID,
  PINNED_START_COLUMN_ID,
  PINNED_END_COLUMN_ID
];

export function isPinnedColumn(columnId: string): boolean {
  return PINNED_COLUMN_IDS.includes(columnId);
}

/**
 * Sticky placement only — the caller sets the background, which a pinned cell
 * must have (opaque) or the scrolled columns show through it.
 *
 * The menu sits at whatever the company column is currently resized to, so the
 * offset has to be computed rather than named.
 */
export function pinnedCellStyle(
  columnId: string,
  companyWidth: number
): CSSProperties | undefined {
  if (columnId === SELECT_COLUMN_ID) return { insetInlineStart: 0 };
  if (columnId === PINNED_START_COLUMN_ID)
    return { insetInlineStart: SELECT_COLUMN_WIDTH };
  if (columnId === PINNED_END_COLUMN_ID)
    return { insetInlineStart: SELECT_COLUMN_WIDTH + companyWidth };
  return undefined;
}

/** Only the last pinned column carries the divider against the scrolling rest. */
export function pinnedCellClass(columnId: string, headerZ = false): string {
  if (!isPinnedColumn(columnId)) return '';
  const z = headerZ ? 'z-30' : 'z-10';
  const divider =
    columnId === PINNED_END_COLUMN_ID ? ' border-r border-warm-line' : '';
  return `sticky ${z}${divider}`;
}
