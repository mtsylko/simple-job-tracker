import type { MouseEvent } from 'react';

/**
 * One row-open rule for every list: the row's title (a link or button marked
 * with `ROW_OPENER`) is its one primary action, and a click anywhere else on the
 * row is forwarded to it. Keyboard users reach the title itself with Tab.
 */
export const ROW_OPENER = { 'data-row-opener': '' } as const;

/** The pointer and the hover fill say the row opens; rows that don't open get neither. */
export const ROW_OPEN_CLASS = 'cursor-pointer hover:bg-row-hover';

/** The title's own focus ring, since the row itself is not a tab stop. No base `outline-hidden`: it would zero the ring's style. */
export const ROW_OPENER_CLASS =
  'rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring';

/** Controls that keep their own click instead of opening the row. */
const OWN_CONTROLS = [
  'a[href]',
  'button',
  'input',
  'select',
  'textarea',
  'label',
  '[role="button"]',
  '[role="switch"]',
  '[role="checkbox"]',
  '[role="menuitem"]',
  '[role="separator"]',
  '[contenteditable="true"]'
].join(',');

function findOpener(
  row: HTMLElement,
  target: EventTarget | null
): HTMLElement | null {
  // Menus and dialogs render in portals but still bubble here through React
  if (!(target instanceof Element) || !row.contains(target)) return null;

  const control = target.closest(OWN_CONTROLS);
  if (control && row.contains(control)) return null;

  // The click that ends a drag-selection must leave the text selected
  const selection = window.getSelection();
  if (
    selection &&
    !selection.isCollapsed &&
    selection.toString().trim() &&
    selection.containsNode(row, true)
  ) {
    return null;
  }

  return row.querySelector<HTMLElement>('[data-row-opener]');
}

function openInNewTab(opener: HTMLElement): boolean {
  if (!(opener instanceof HTMLAnchorElement)) return false;
  window.open(opener.href, '_blank', 'noopener');
  return true;
}

function handleRowClick(event: MouseEvent<HTMLElement>) {
  if (event.defaultPrevented || event.button !== 0) return;
  const opener = findOpener(event.currentTarget, event.target);
  if (!opener) return;
  if ((event.metaKey || event.ctrlKey) && openInNewTab(opener)) return;
  opener.click();
}

function handleRowAuxClick(event: MouseEvent<HTMLElement>) {
  if (event.defaultPrevented || event.button !== 1) return;
  const opener = findOpener(event.currentTarget, event.target);
  if (opener && openInNewTab(opener)) event.preventDefault();
}

/** Spread on the row element: `<tr {...rowOpenHandlers}>`. */
export const rowOpenHandlers = {
  onClick: handleRowClick,
  onAuxClick: handleRowAuxClick
};
