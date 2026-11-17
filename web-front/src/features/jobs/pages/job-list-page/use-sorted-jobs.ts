import { useMemo } from 'react';
import type { SortingState } from '@tanstack/react-table';
import type { JobStatusOption } from '@job-tracker/shared';

import type { JobRow } from '@/features/jobs/types';

/** Closed (an outcome is set) or archived: no longer moving through the pipeline. */
function isClosed(row: JobRow): boolean {
  return row.outcome !== '' || row.archivedAt !== '';
}

/** Sorts outside the table (`manualSorting`) because grouping runs on the sorted result. */
export function useSortedJobs(
  jobs: JobRow[],
  sorting: SortingState,
  statusOptions: JobStatusOption[]
): JobRow[] {
  const collator = useMemo(
    () => new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' }),
    []
  );

  // A status missing from the options (archived since) ranks below the first stage.
  const statusRank = useMemo(() => {
    const ranks = new Map(
      statusOptions.map((option, index) => [option.value, index])
    );
    return (row: JobRow) => ranks.get(row.status) ?? -1;
  }, [statusOptions]);

  const sortValueGetters = useMemo<
    Record<string, (row: JobRow) => string | number>
  >(
    () => ({
      company: (row) => row.company,
      jobPostLink: (row) => row.jobPostLink,
      role: (row) => row.role,
      level: (row) => row.level,
      type: (row) => row.type,
      cv: (row) => row.cv,
      statusChangedAt: (row) => row.statusChangedAt,
      outcome: (row) => row.outcome,
      salaryRange: (row) => row.salaryRange,
      appliedAt: (row) => row.appliedAt,
      notes: (row) => row.notes,
      applicationQuestions: (row) => row.applicationQuestions
    }),
    []
  );

  return useMemo(() => {
    if (sorting.length === 0) return jobs;
    return [...jobs].sort((a, b) => {
      for (const { id, desc } of sorting) {
        const dir = desc ? -1 : 1;

        // Pipeline order, not label: open before closed either way, then stage, then newest applied.
        if (id === 'status') {
          const result =
            Number(isClosed(a)) - Number(isClosed(b)) ||
            (statusRank(a) - statusRank(b)) * dir ||
            collator.compare(b.appliedAt, a.appliedAt);
          if (result !== 0) return result;
          continue;
        }

        const getValue = sortValueGetters[id];
        if (!getValue) continue;
        const va = getValue(a);
        const vb = getValue(b);
        const result =
          typeof va === 'number' && typeof vb === 'number'
            ? va - vb
            : collator.compare(String(va), String(vb));
        if (result !== 0) return result * dir;
      }
      return 0;
    });
  }, [collator, jobs, sorting, sortValueGetters, statusRank]);
}
