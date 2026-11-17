import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ColumnSizingState, VisibilityState } from '@tanstack/react-table';

/**
 * The data columns, in the order the table declares them. `company` and
 * `actions` are deliberately absent: one is the row's title and click target,
 * the other its menu, so neither may be hidden.
 */
export const HIDEABLE_JOB_COLUMN_IDS = [
  'appliedAt',
  'status',
  'statusChangedAt',
  'outcome',
  'jobPostLink',
  'role',
  'level',
  'type',
  'employmentType',
  'contractType',
  'salaryRange',
  'cv',
  'notes',
  'applicationQuestions'
] as const;

export type HideableJobColumnId = (typeof HIDEABLE_JOB_COLUMN_IDS)[number];

/** `company` resizes too, it just cannot be hidden. */
const RESIZABLE_COLUMN_IDS: readonly string[] = [
  'company',
  ...HIDEABLE_JOB_COLUMN_IDS
];

const STORAGE_KEY = 'job-tracker:jobs-table-layout:v1';

type JobTableLayout = {
  columnVisibility: VisibilityState;
  columnSizing: ColumnSizingState;
};

/** Rarely read while scanning the list, so they wait in the column picker. */
const DEFAULT_HIDDEN_COLUMN_IDS: readonly HideableJobColumnId[] = [
  'statusChangedAt',
  'outcome',
  'employmentType',
  'contractType',
  'notes',
  'applicationQuestions'
];

const DEFAULT_COLUMN_VISIBILITY: VisibilityState = Object.fromEntries(
  DEFAULT_HIDDEN_COLUMN_IDS.map((id) => [id, false])
);

/** Empty sizing means every column at its declared width. */
const DEFAULT_LAYOUT: JobTableLayout = {
  columnVisibility: DEFAULT_COLUMN_VISIBILITY,
  columnSizing: {}
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

/**
 * Keeps only entries naming a column this build still renders.
 *
 * A layout saved by an older build can reference columns that have since been
 * renamed or removed; without this, a stale entry would either resize nothing
 * or, worse, survive a rename and hide a column the picker no longer lists.
 */
function reconcileLayout(payload: unknown): JobTableLayout {
  const stored = asRecord(payload);
  const storedVisibility = asRecord(stored.columnVisibility);
  const storedSizing = asRecord(stored.columnSizing);

  // A column the viewer never toggled follows the current default.
  const columnVisibility: VisibilityState = { ...DEFAULT_COLUMN_VISIBILITY };
  for (const id of HIDEABLE_JOB_COLUMN_IDS) {
    if (typeof storedVisibility[id] === 'boolean') {
      columnVisibility[id] = storedVisibility[id] as boolean;
    }
  }

  const columnSizing: ColumnSizingState = {};
  for (const id of RESIZABLE_COLUMN_IDS) {
    const width = storedSizing[id];
    if (typeof width === 'number' && Number.isFinite(width) && width > 0) {
      columnSizing[id] = width;
    }
  }

  return { columnVisibility, columnSizing };
}

function readLayout(): JobTableLayout {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw === null ? DEFAULT_LAYOUT : reconcileLayout(JSON.parse(raw));
  } catch {
    // Storage can be unavailable or hold hand-edited junk; a default table is
    // a better outcome than a list page that will not mount.
    return DEFAULT_LAYOUT;
  }
}

/**
 * Which columns are shown and how wide they are, remembered across reloads.
 *
 * Local to the browser rather than the account: the server-side layout store
 * behind `/api/form-layout` would carry it across devices, and moving it there
 * later only changes the two functions above.
 */
export function useJobTableLayout() {
  const [layout, setLayout] = useState<JobTableLayout>(readLayout);

  const { columnVisibility, columnSizing } = layout;

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
    } catch {
      // A table that cannot remember its layout still works; a throw here would
      // take the whole list down with it.
    }
  }, [layout]);

  const setColumnVisibility = useCallback(
    (
      updater: VisibilityState | ((old: VisibilityState) => VisibilityState)
    ) => {
      setLayout((prev) => ({
        ...prev,
        columnVisibility:
          typeof updater === 'function'
            ? updater(prev.columnVisibility)
            : updater
      }));
    },
    []
  );

  const setColumnSizing = useCallback(
    (
      updater:
        | ColumnSizingState
        | ((old: ColumnSizingState) => ColumnSizingState)
    ) => {
      setLayout((prev) => ({
        ...prev,
        columnSizing:
          typeof updater === 'function' ? updater(prev.columnSizing) : updater
      }));
    },
    []
  );

  const resetLayout = useCallback(() => setLayout(DEFAULT_LAYOUT), []);

  const hiddenColumnCount = useMemo(
    () =>
      HIDEABLE_JOB_COLUMN_IDS.filter((id) => columnVisibility[id] === false)
        .length,
    [columnVisibility]
  );

  return {
    columnVisibility,
    setColumnVisibility,
    columnSizing,
    setColumnSizing,
    resetLayout,
    hiddenColumnCount
  };
}
