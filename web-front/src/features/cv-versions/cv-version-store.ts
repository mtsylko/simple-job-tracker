import { create } from 'zustand';

import {
  createCvVersion as createCvVersionRequest,
  deleteCvVersion as deleteCvVersionRequest,
  listCvVersions,
  patchCvVersionEnabled,
  updateCvVersion as updateCvVersionRequest
} from '@/features/cv-versions/cv-version-api';
import type {
  CvVersionFormValues,
  CvVersionRow
} from '@/features/cv-versions/types';
import { readErrorMessage } from '@/features/utils';
import {
  trackCvVersionCreated,
  trackCvVersionDeleted
} from '@/lib/analytics-events';

type CvVersionsState = {
  cvVersions: CvVersionRow[];
  /** A list request is in flight. */
  isLoading: boolean;
  /** Why the list could not be loaded; a failed mutation is reported to its caller instead. */
  error: string | null;
  /** `cvVersions` holds a list fetched from the API. */
  hasLoaded: boolean;
  refreshCvVersions: () => Promise<void>;
  createCvVersion: (values: CvVersionFormValues) => Promise<void>;
  updateCvVersion: (id: string, values: CvVersionFormValues) => Promise<void>;
  toggleCvVersionEnabled: (id: string, enabled: boolean) => Promise<void>;
  deleteCvVersion: (id: string) => Promise<void>;
};

export const useCvVersionsStore = create<CvVersionsState>((set, get) => ({
  cvVersions: [],
  isLoading: false,
  error: null,
  hasLoaded: false,
  async refreshCvVersions() {
    if (get().isLoading) {
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const data = await listCvVersions();
      set({ cvVersions: data, hasLoaded: true });
    } catch (caughtError) {
      set({ error: readErrorMessage(caughtError) });
    } finally {
      set({ isLoading: false });
    }
  },
  async createCvVersion(values) {
    try {
      const created = await createCvVersionRequest(values);
      set((state) => ({ cvVersions: [created, ...state.cvVersions] }));
      trackCvVersionCreated();
    } catch (caughtError) {
      throw new Error(readErrorMessage(caughtError));
    }
  },
  async updateCvVersion(id, values) {
    try {
      const updated = await updateCvVersionRequest(id, values);
      set((state) => ({
        cvVersions: state.cvVersions.map((item) =>
          item.id === id ? updated : item
        )
      }));
    } catch (caughtError) {
      throw new Error(readErrorMessage(caughtError));
    }
  },
  async toggleCvVersionEnabled(id, enabled) {
    // Optimistic update first
    set((state) => ({
      cvVersions: state.cvVersions.map((item) =>
        item.id === id ? { ...item, enabled } : item
      )
    }));

    try {
      const updated = await patchCvVersionEnabled(id, enabled);
      set((state) => ({
        cvVersions: state.cvVersions.map((item) =>
          item.id === id ? updated : item
        )
      }));
    } catch (caughtError) {
      // Revert optimistic update on failure
      set((state) => ({
        cvVersions: state.cvVersions.map((item) =>
          item.id === id ? { ...item, enabled: !enabled } : item
        )
      }));
      throw new Error(readErrorMessage(caughtError));
    }
  },
  async deleteCvVersion(id) {
    try {
      await deleteCvVersionRequest(id);
      set((state) => ({
        cvVersions: state.cvVersions.filter((item) => item.id !== id)
      }));
      trackCvVersionDeleted();
    } catch (caughtError) {
      throw new Error(readErrorMessage(caughtError));
    }
  }
}));
