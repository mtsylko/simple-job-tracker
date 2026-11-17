import { useCallback, useEffect, useMemo } from 'react';
import type { TFunction } from 'i18next';
import { useNavigate } from 'react-router-dom';
import { createSerializer, parseAsStringLiteral, useQueryState } from 'nuqs';

import type { SelectFieldOption } from '@/components/ui/select-field';
import type { JobRow } from '@/features/jobs/types';

/** Rolling windows in months, plus the unbounded default. */
export const ANALYTICS_RANGE_VALUES = ['all', '1m', '3m', '6m', '12m'] as const;

export type AnalyticsRange = (typeof ANALYTICS_RANGE_VALUES)[number];

/** Unbounded: recent applications have not had time to progress, so a short default would understate every rate. */
export const DEFAULT_ANALYTICS_RANGE: AnalyticsRange = 'all';

const RANGE_MONTHS: Record<Exclude<AnalyticsRange, 'all'>, number> = {
  '1m': 1,
  '3m': 3,
  '6m': 6,
  '12m': 12
};

/** Local date; toISOString would shift a day. */
export function toIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Window start as `YYYY-MM-DD`, matching appliedAt so the compare stays a string compare. Null when unbounded. */
export function analyticsRangeCutoff(
  range: AnalyticsRange,
  now: Date = new Date()
): string | null {
  if (range === 'all') return null;

  const cutoff = new Date(now);
  const dayOfMonth = cutoff.getDate();
  cutoff.setMonth(cutoff.getMonth() - RANGE_MONTHS[range]);
  // setMonth overflows a shorter month (Aug 31 − 6mo → Mar 3); pull back to its last day.
  if (cutoff.getDate() !== dayOfMonth) cutoff.setDate(0);

  return toIsoDate(cutoff);
}

/**
 * Status changes are not timestamped, so a window selects the applications
 * *sent* in it, at whatever status they have reached since. Undated ones fall
 * outside every bounded window.
 */
export function useJobsInRange(
  jobs: JobRow[],
  range: AnalyticsRange
): JobRow[] {
  return useMemo(() => {
    const cutoff = analyticsRangeCutoff(range);
    if (!cutoff) return jobs;
    return jobs.filter((job) => job.appliedAt >= cutoff);
  }, [jobs, range]);
}

export function getAnalyticsRangeOptions(
  t: TFunction<'analytics'>
): SelectFieldOption[] {
  return ANALYTICS_RANGE_VALUES.map((value) => ({
    value,
    label: t(`range.options.${value}`)
  }));
}

const RANGE_PARSER = parseAsStringLiteral(ANALYTICS_RANGE_VALUES).withDefault(
  DEFAULT_ANALYTICS_RANGE
);

/** Produces the query string for a range, the default omitted. */
const serializeRangeState = createSerializer({ range: RANGE_PARSER });

/** Per tab rather than per browser, so two windows keep independent ranges. */
const STORAGE_KEY = 'job-tracker:analytics-range';

/** Storage throws when disabled or full; the range is not worth breaking the page over. */
function readStoredSearch(): string {
  try {
    return window.sessionStorage.getItem(STORAGE_KEY) ?? '';
  } catch {
    return '';
  }
}

function writeStoredSearch(search: string): void {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, search);
  } catch {
    // Persistence is a convenience; losing it must not break the page.
  }
}

/**
 * Kept in the query string, so a reload or a shared link opens the same view.
 *
 * The URL is the source of truth, managed by nuqs. Session storage only seeds it
 * when analytics is entered with a bare URL, which is how the sidebar link back
 * from another page arrives; an address that says something always wins, and the
 * restored value is re-validated by the same parser.
 */
export function useAnalyticsRange(): {
  range: AnalyticsRange;
  setRange: (range: AnalyticsRange) => void;
} {
  const navigate = useNavigate();
  const [range, setQueryRange] = useQueryState('range', RANGE_PARSER);

  useEffect(() => {
    if (window.location.search) return;

    const stored = readStoredSearch();
    if (!stored) return;

    navigate({ search: stored }, { replace: true });
    // A mount-time decision only: later renders must not undo a bare URL.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setRange = useCallback(
    (next: AnalyticsRange) => {
      void setQueryRange(next);
      writeStoredSearch(serializeRangeState({ range: next }));
    },
    [setQueryRange]
  );

  return { range, setRange };
}
