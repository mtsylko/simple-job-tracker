import { useCallback, useMemo } from 'react';
import type { OnChangeFn, SortingState } from '@tanstack/react-table';
import {
  createSerializer,
  debounce,
  parseAsBoolean,
  parseAsString,
  parseAsStringLiteral,
  useQueryState,
  useQueryStates,
  type inferParserType
} from 'nuqs';

import { DEFAULT_JOB_SCOPE, JOB_SCOPE_VALUES } from '@/features/jobs/types';

import { DEFAULT_TAB, type TabKey } from './use-job-list-filters';
import { HIDEABLE_JOB_COLUMN_IDS } from './use-job-table-layout';

/**
 * One parser per filter. The key is both the state field and the URL parameter,
 * and the parser validates on read — a hand-edited `?scope=banana` falls back to
 * the default instead of filtering the table by something the UI cannot show.
 */
const FILTER_PARSERS = {
  company: parseAsString.withDefault(''),
  role: parseAsString.withDefault(''),
  type: parseAsString.withDefault(''),
  employmentType: parseAsString.withDefault(''),
  contractType: parseAsString.withDefault(''),
  level: parseAsString.withDefault(''),
  outcome: parseAsString.withDefault(''),
  productOnly: parseAsBoolean.withDefault(false),
  appliedFrom: parseAsString.withDefault(''),
  appliedTo: parseAsString.withDefault(''),
  scope: parseAsStringLiteral(JOB_SCOPE_VALUES).withDefault(DEFAULT_JOB_SCOPE)
};

// The tab set is user-defined (statuses flagged as tabs), so it cannot be a
// fixed literal here; the list page falls back to `all` for an unknown value.
const TAB_PARSER = parseAsString.withDefault(DEFAULT_TAB);

/** Every column the table can sort by: the pinned company plus the data columns. */
const SORTABLE_COLUMN_IDS = ['company', ...HIDEABLE_JOB_COLUMN_IDS] as const;
const SORT_DIRECTIONS = ['asc', 'desc'] as const;

// Furthest stage first, newest first within a stage (see `useSortedJobs`).
const DEFAULT_SORT_ID: (typeof SORTABLE_COLUMN_IDS)[number] = 'status';
const DEFAULT_SORT_DIR: (typeof SORT_DIRECTIONS)[number] = 'desc';

// Sort column and direction ride in the URL like the filters, and revalidate on
// read: a hand-edited `?sort=banana` falls back to the default.
const SORT_PARSERS = {
  sort: parseAsStringLiteral(SORTABLE_COLUMN_IDS).withDefault(DEFAULT_SORT_ID),
  dir: parseAsStringLiteral(SORT_DIRECTIONS).withDefault(DEFAULT_SORT_DIR)
};

type SortValues = inferParserType<typeof SORT_PARSERS>;

export type JobFilterValues = inferParserType<typeof FILTER_PARSERS>;

const DEFAULT_FILTER_VALUES: JobFilterValues = {
  company: '',
  role: '',
  type: '',
  employmentType: '',
  contractType: '',
  level: '',
  outcome: '',
  productOnly: false,
  appliedFrom: '',
  appliedTo: '',
  scope: DEFAULT_JOB_SCOPE
};

/** Company stays on the filter bar and scope on the view controls, so neither counts. */
export function countHiddenFilters(values: JobFilterValues): number {
  return [
    values.role,
    values.level,
    values.type,
    values.employmentType,
    values.contractType,
    values.outcome,
    values.appliedFrom,
    values.appliedTo,
    values.productOnly
  ].filter(Boolean).length;
}

/** Produces the query string for a set of values, defaults omitted. */
const serializeFilterState = createSerializer({
  ...FILTER_PARSERS,
  ...SORT_PARSERS,
  tab: TAB_PARSER
});

/** Typing a company name should not write a URL per keystroke. */
const TEXT_INPUT_UPDATES = debounce(300);

/**
 * Per tab rather than per browser: two windows keep independent filters, and a
 * list left filtered weeks ago does not come back unexplained.
 */
const STORAGE_KEY = 'job-tracker:job-list-filters';

/** Storage throws when disabled or full; filters are not worth breaking the page over. */
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
    // Persistence is a convenience; losing it must not break filtering.
  }
}

/**
 * The last applications search (filters, tab, sort), e.g. `?tab=Applied&dir=asc`
 * or `''`. Lets a nav link back to the list carry the state the user left it in,
 * so switching sections and returning keeps the same view.
 */
export function getStoredListSearch(): string {
  return readStoredSearch();
}

/**
 * The stored search to restore when the list is entered with a bare URL, or null
 * when the address already carries one (which always wins). The list route
 * redirects to this *before* it paints, so restored filters and sort never flash
 * in from a second render.
 */
export function getPersistedListSearch(): string | null {
  if (typeof window === 'undefined' || window.location.search) return null;
  return readStoredSearch() || null;
}

/**
 * Keeps the list filters and the active status tab in the query string, so they
 * survive a reload, a shared link, and the round trip through the job form —
 * component state would be dropped when the list unmounts on navigation.
 *
 * The URL is the source of truth, managed by nuqs. Session storage only seeds it
 * when the list is entered with a bare URL, which is how the sidebar links back
 * from Taxonomies or Analytics arrive; that restore is a pre-paint redirect in
 * the list route (see `getPersistedListSearch`), so an address that says
 * something always wins and no stale first render flashes through. Clearing is
 * written through like any other change, so cleared stays cleared.
 */
export function useJobListUrlFilters(): {
  filterValues: JobFilterValues;
  setFilter: <K extends keyof JobFilterValues>(
    name: K,
    value: JobFilterValues[K]
  ) => void;
  clearFilters: () => void;
  activeTab: TabKey;
  setActiveTab: (tab: TabKey) => void;
  sorting: SortingState;
  setSorting: OnChangeFn<SortingState>;
} {
  const [filterValues, setFilters] = useQueryStates(FILTER_PARSERS);
  const [activeTab, setTab] = useQueryState('tab', TAB_PARSER);
  const [sortState, setSortState] = useQueryStates(SORT_PARSERS);

  // The table always keeps exactly one active sort, so a single-entry state is
  // the whole story; `useSortedJobs` reads `desc` from it.
  const sorting = useMemo<SortingState>(
    () => [{ id: sortState.sort, desc: sortState.dir === 'desc' }],
    [sortState]
  );

  const persist = useCallback(
    (values: JobFilterValues, tab: TabKey, sort: SortValues) => {
      writeStoredSearch(serializeFilterState({ ...values, ...sort, tab }));
    },
    []
  );

  const setFilter = useCallback(
    <K extends keyof JobFilterValues>(name: K, value: JobFilterValues[K]) => {
      void setFilters(
        { [name]: value } as Partial<JobFilterValues>,
        name === 'company' ? { limitUrlUpdates: TEXT_INPUT_UPDATES } : undefined
      );
      persist({ ...filterValues, [name]: value }, activeTab, sortState);
    },
    [activeTab, filterValues, persist, setFilters, sortState]
  );

  /**
   * One update for every filter at once, leaving the status tab alone — and the
   * scope, which sits with the view controls rather than in the filter bar this
   * button belongs to.
   */
  const clearFilters = useCallback(() => {
    const cleared = { ...DEFAULT_FILTER_VALUES, scope: filterValues.scope };
    void setFilters(cleared);
    persist(cleared, activeTab, sortState);
  }, [activeTab, filterValues.scope, persist, setFilters, sortState]);

  const setActiveTab = useCallback(
    (tab: TabKey) => {
      void setTab(tab);
      persist(filterValues, tab, sortState);
    },
    [filterValues, persist, setTab, sortState]
  );

  const setSorting = useCallback<OnChangeFn<SortingState>>(
    (updater) => {
      const next = typeof updater === 'function' ? updater(sorting) : updater;
      // Removal is disabled, so there is always an entry; default defensively.
      const entry = next[0] ?? { id: DEFAULT_SORT_ID, desc: true };
      const nextSort: SortValues = {
        sort: (entry.id as SortValues['sort']) ?? DEFAULT_SORT_ID,
        dir: entry.desc ? 'desc' : 'asc'
      };
      void setSortState(nextSort);
      persist(filterValues, activeTab, nextSort);
    },
    [activeTab, filterValues, persist, setSortState, sorting]
  );

  return {
    filterValues,
    setFilter,
    clearFilters,
    activeTab,
    setActiveTab,
    sorting,
    setSorting
  };
}
