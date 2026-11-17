import { create } from 'zustand';
import type { JobStatusOption, JobTaxonomyOption } from '@job-tracker/shared';

import {
  jobContractTypeTaxonomy,
  jobEmploymentTypeTaxonomy,
  jobLevelTaxonomy,
  jobOutcomeTaxonomy,
  jobRoleTaxonomy,
  jobStatusTaxonomy,
  jobTypeTaxonomy,
  type TaxonomyOptionClient
} from '@/features/jobs/job-api';
import i18n from '@/i18n';

import type { TaxonomyKind, TaxonomyListState } from './use-taxonomy-lists';
import type { StatusListState } from './use-status-list';

// Persist the last-known lists so a revisit paints real rows (and the right row
// count) on the first frame instead of a skeleton that then jumps. Survives full
// reloads and sessions; a stale read is corrected by the background revalidate.
const CACHE_PREFIX = 'jt.taxonomy-cache.';

function readCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeCache(key: string, value: unknown): void {
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(value));
  } catch {
    // Ignore quota / serialization failures — the cache is best-effort.
  }
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message.trim().length > 0
    ? error.message
    : fallback;
}

const LIST_CLIENTS: Record<TaxonomyKind, TaxonomyOptionClient> = {
  role: jobRoleTaxonomy,
  level: jobLevelTaxonomy,
  type: jobTypeTaxonomy,
  employmentType: jobEmploymentTypeTaxonomy,
  contractType: jobContractTypeTaxonomy,
  outcome: jobOutcomeTaxonomy
};

const TAXONOMY_KINDS: TaxonomyKind[] = [
  'role',
  'level',
  'type',
  'employmentType',
  'contractType',
  'outcome'
];

function initTaxonomyState(kind: TaxonomyKind): TaxonomyListState {
  return {
    options: readCache<JobTaxonomyOption[]>(kind) ?? [],
    isLoading: true,
    error: null
  };
}

function initStatusState(): StatusListState {
  return {
    options: readCache<JobStatusOption[]>('status') ?? [],
    isLoading: true,
    error: null
  };
}

// Dedupes the boot warm-up against a consumer mounting at the same instant.
// Cleared once the load settles, so a later mount revalidates and a failed load
// is retried rather than stuck on the error.
let inFlight: Promise<void> | null = null;

type TaxonomyStore = {
  taxonomy: Record<TaxonomyKind, TaxonomyListState>;
  status: StatusListState;
  ensureLoaded: () => void;
  reloadTaxonomy: (kind: TaxonomyKind) => Promise<void>;
  reloadStatus: () => Promise<void>;
  setTaxonomyOptions: (
    kind: TaxonomyKind,
    options: JobTaxonomyOption[]
  ) => void;
  setStatusOptions: (options: JobStatusOption[]) => void;
};

export const useTaxonomyStore = create<TaxonomyStore>((set, get) => ({
  taxonomy: {
    role: initTaxonomyState('role'),
    level: initTaxonomyState('level'),
    type: initTaxonomyState('type'),
    employmentType: initTaxonomyState('employmentType'),
    contractType: initTaxonomyState('contractType'),
    outcome: initTaxonomyState('outcome')
  },
  status: initStatusState(),

  ensureLoaded() {
    if (inFlight) {
      return;
    }
    inFlight = Promise.all([
      ...TAXONOMY_KINDS.map((kind) => get().reloadTaxonomy(kind)),
      get().reloadStatus()
    ])
      .then(() => undefined)
      .finally(() => {
        inFlight = null;
      });
  },

  async reloadTaxonomy(kind) {
    try {
      const options = await LIST_CLIENTS[kind].list();
      writeCache(kind, options);
      set((state) => ({
        taxonomy: {
          ...state.taxonomy,
          [kind]: { options, isLoading: false, error: null }
        }
      }));
    } catch (error) {
      set((state) => {
        const prev = state.taxonomy[kind];
        return {
          taxonomy: {
            ...state.taxonomy,
            [kind]: {
              options: prev.options,
              isLoading: false,
              // Keep showing stale rows on a background refresh failure; only
              // surface the error when there is nothing cached to fall back to.
              error:
                prev.options.length > 0
                  ? null
                  : errorMessage(
                      error,
                      i18n.t('loadError', { ns: 'taxonomies' })
                    )
            }
          }
        };
      });
    }
  },

  async reloadStatus() {
    try {
      const options = await jobStatusTaxonomy.list();
      writeCache('status', options);
      set({ status: { options, isLoading: false, error: null } });
    } catch (error) {
      set((state) => {
        const prev = state.status;
        return {
          status: {
            options: prev.options,
            isLoading: false,
            error:
              prev.options.length > 0
                ? null
                : errorMessage(
                    error,
                    i18n.t('loadStatusesError', { ns: 'taxonomies' })
                  )
          }
        };
      });
    }
  },

  // Optimistic reorder: reflected immediately and persisted so a reload keeps
  // the new order even though the server response is not awaited here.
  setTaxonomyOptions(kind, options) {
    writeCache(kind, options);
    set((state) => ({
      taxonomy: {
        ...state.taxonomy,
        [kind]: { ...state.taxonomy[kind], options }
      }
    }));
  },

  setStatusOptions(options) {
    writeCache('status', options);
    set((state) => ({ status: { ...state.status, options } }));
  }
}));
