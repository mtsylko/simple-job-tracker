import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { normalizeCompanyName } from '@job-tracker/shared';

import type { SelectFieldOption } from '@/components/ui/select-field';
import {
  getJobScopeOptions,
  isArchived,
  type JobRow,
  type JobScope
} from '@/features/jobs/types';
import type { JobFilterValues } from '@/features/jobs/pages/job-list-page/use-job-list-url-filters';

/**
 * A tab is either the "all" pseudo-tab or a status value. The set is now
 * user-defined (statuses flagged `showAsTab`), so it is data, not a literal.
 */
export const ALL_TAB = 'all';

export type TabKey = string;

export const DEFAULT_TAB: TabKey = ALL_TAB;

/** Applied before the tabs, so the tab counts describe the rows on screen. */
export function useScopedJobs(jobs: JobRow[], scope: JobScope): JobRow[] {
  return useMemo(() => {
    if (scope === 'all') return jobs;
    const wantArchived = scope === 'archived';
    return jobs.filter((job) => isArchived(job) === wantArchived);
  }, [jobs, scope]);
}

export function filterByTab(jobs: JobRow[], tab: TabKey): JobRow[] {
  return tab === ALL_TAB ? jobs : jobs.filter((job) => job.status === tab);
}

/**
 * Counts every tab in a single pass, rather than re-filtering per tab. Only the
 * given `tabStatuses` (plus `all`) get a count; jobs in a non-tab status still
 * count toward `all`.
 */
export function useTabCounts(
  jobs: JobRow[],
  tabStatuses: string[]
): Record<TabKey, number> {
  return useMemo(() => {
    const counts: Record<TabKey, number> = { [ALL_TAB]: jobs.length };
    for (const status of tabStatuses) {
      counts[status] = 0;
    }
    for (const job of jobs) {
      if (job.status in counts && job.status !== ALL_TAB) {
        counts[job.status] += 1;
      }
    }
    return counts;
  }, [jobs, tabStatuses]);
}

/**
 * Taxonomy filter options, built from the values the listed jobs actually use.
 * Role, level and type are free-form per-user taxonomies, so there is no fixed
 * list to offer — and deriving them here keeps the dropdowns from listing
 * values that would match nothing.
 */
function toFilterOptions(values: string[]): SelectFieldOption[] {
  return Array.from(
    new Set(
      values.map((value) => value.trim()).filter((value) => value.length > 0)
    )
  )
    .sort((a, b) => a.localeCompare(b))
    .map((value) => ({ value, label: value }));
}

export function useJobFilterOptions(jobs: JobRow[]) {
  const { t } = useTranslation('jobs');

  return useMemo(
    () => ({
      roleOptions: [
        { value: '', label: t('list.filters.allRoles') },
        ...toFilterOptions(jobs.map((job) => job.role))
      ],
      typeOptions: [
        { value: '', label: t('list.filters.allTypes') },
        ...toFilterOptions(jobs.map((job) => job.type))
      ],
      employmentTypeOptions: [
        { value: '', label: t('list.filters.allEmploymentTypes') },
        ...toFilterOptions(jobs.map((job) => job.employmentType))
      ],
      contractTypeOptions: [
        { value: '', label: t('list.filters.allContractTypes') },
        ...toFilterOptions(jobs.map((job) => job.contractType))
      ],
      levelOptions: [
        { value: '', label: t('list.filters.allLevels') },
        ...toFilterOptions(jobs.map((job) => job.level))
      ],
      outcomeOptions: [
        { value: '', label: t('list.filters.allOutcomes') },
        ...toFilterOptions(jobs.map((job) => job.outcome))
      ],
      scopeOptions: getJobScopeOptions(t)
    }),
    [jobs, t]
  );
}

export function useFilteredJobs(
  jobs: JobRow[],
  activeTab: TabKey,
  filterValues: JobFilterValues
): JobRow[] {
  return useMemo(() => {
    const {
      company,
      role,
      type,
      employmentType,
      contractType,
      level,
      outcome,
      productOnly,
      appliedFrom,
      appliedTo
    } = filterValues;
    // Normalized like the companies page, so its counts match what a company link shows.
    const companyQuery = normalizeCompanyName(company);

    const matchers: Array<(job: JobRow) => boolean> = [
      (job) =>
        !companyQuery ||
        normalizeCompanyName(job.company).includes(companyQuery),
      (job) => !role || job.role === role,
      (job) => !type || job.type === type,
      (job) => !employmentType || job.employmentType === employmentType,
      (job) => !contractType || job.contractType === contractType,
      (job) => !level || job.level === level,
      (job) => !outcome || job.outcome === outcome,
      (job) => !productOnly || job.isProductCompany,
      (job) => !appliedFrom || job.appliedAt >= appliedFrom,
      (job) => !appliedTo || job.appliedAt <= appliedTo
    ];

    return filterByTab(jobs, activeTab).filter((job) =>
      matchers.every((match) => match(job))
    );
  }, [jobs, activeTab, filterValues]);
}
