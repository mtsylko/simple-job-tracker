import { create } from 'zustand';
import {
  normalizeCompanyName,
  type CompanyBlacklist
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
};

let inFlight: Promise<void> | null = null;

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
    if (inFlight) {
      return inFlight;
    }
    inFlight = (async () => {
      try {
        const companies = await listCompanies();
        const byCompany = new Map<string, CompanyBlacklist>();
        for (const company of companies) {
          if (company.blacklist) {
            byCompany.set(
              normalizeCompanyName(company.name),
              company.blacklist
            );
          }
        }
        set({ byCompany, isLoaded: true });
      } catch {
        // Best-effort: leave the prior map in place. A failed refresh just means
        // the marks are stale, never that the list breaks.
      } finally {
        inFlight = null;
      }
    })();
    return inFlight;
  }
}));

/** The blacklisting of this company name, or null. */
export function useCompanyBlacklist(company: string): CompanyBlacklist | null {
  const key = normalizeCompanyName(company);
  return useBlacklistStore((state) =>
    key ? (state.byCompany.get(key) ?? null) : null
  );
}
