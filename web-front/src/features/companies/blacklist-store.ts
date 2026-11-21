import { create } from 'zustand';
import {
  normalizeCompanyName,
  type CompanyBlacklist,
  type CompanySummary
} from '@job-tracker/shared';

import { listCompanies } from './companies-api';

// Shared source for marking blacklisted companies in the applications list. Kept
// separate from the companies page's local state, and refreshed by every
// blacklist mutation so the marks stay in sync.
type BlacklistStore = {
  byCompany: Map<string, CompanyBlacklist>;
  isLoaded: boolean;
  /** Loads once; a no-op after the first successful load. */
  ensureLoaded: () => void;
  /** Always refetches — call after a mutation to refresh the marks. */
  reload: () => Promise<void>;
  /** Takes the marks from a company list the caller has just read. */
  replace: (companies: CompanySummary[]) => void;
};

let inFlight: Promise<void> | null = null;
// Only the newest read may land: an older one can predate the write that asked for a refresh.
let latest = 0;

function marks(companies: CompanySummary[]): Map<string, CompanyBlacklist> {
  const byCompany = new Map<string, CompanyBlacklist>();
  for (const company of companies) {
    if (company.blacklist) {
      byCompany.set(normalizeCompanyName(company.name), company.blacklist);
    }
  }
  return byCompany;
}

export const useBlacklistStore = create<BlacklistStore>((set, get) => ({
  byCompany: new Map(),
  isLoaded: false,

  ensureLoaded() {
    if (get().isLoaded || inFlight) {
      return;
    }
    void get().reload();
  },

  reload() {
    latest += 1;
    const ticket = latest;
    const request: Promise<void> = listCompanies()
      .then(
        (companies) => {
          if (ticket === latest) {
            set({ byCompany: marks(companies), isLoaded: true });
          }
        },
        () => {
          // Best-effort: leave the prior map in place. A failed refresh just means
          // the marks are stale, never that the list breaks.
        }
      )
      .finally(() => {
        if (inFlight === request) {
          inFlight = null;
        }
      });
    inFlight = request;
    return request;
  },

  replace(companies) {
    latest += 1;
    set({ byCompany: marks(companies), isLoaded: true });
  }
}));

/** The blacklisting of this company name, or null. */
export function useCompanyBlacklist(company: string): CompanyBlacklist | null {
  const key = normalizeCompanyName(company);
  return useBlacklistStore((state) =>
    key ? (state.byCompany.get(key) ?? null) : null
  );
}
