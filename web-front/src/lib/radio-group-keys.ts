import type { KeyboardEvent } from 'react';

const NEXT_KEYS = new Set(['ArrowRight', 'ArrowDown']);
const PREVIOUS_KEYS = new Set(['ArrowLeft', 'ArrowUp']);

/** Arrows, Home and End move focus within the `role="radiogroup"` and check the radio they land on. */
export function handleRadioGroupKeyDown(
  event: KeyboardEvent<HTMLElement>,
  onMove: (index: number) => void
): void {
  const group = event.currentTarget.closest('[role="radiogroup"]');
  if (!group) return;
  const radios = Array.from(
    group.querySelectorAll<HTMLElement>('[role="radio"]')
  );
  const index = radios.indexOf(event.currentTarget);
  const count = radios.length;

  let next: number;
  if (NEXT_KEYS.has(event.key)) next = (index + 1) % count;
  else if (PREVIOUS_KEYS.has(event.key)) next = (index - 1 + count) % count;
  else if (event.key === 'Home') next = 0;
  else if (event.key === 'End') next = count - 1;
  else return;

  event.preventDefault();
  radios[next].focus();
  onMove(next);
}

/** Roving tab stop: the checked radio, or the first one while none is checked. */
export function radioTabIndex(
  isChecked: boolean,
  index: number,
  hasChecked: boolean
): 0 | -1 {
  return isChecked || (!hasChecked && index === 0) ? 0 : -1;
}
