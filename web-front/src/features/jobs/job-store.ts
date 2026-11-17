import { create } from 'zustand';

import {
  createJob as createJobRequest,
  deleteJob as deleteJobRequest,
  listJobs,
  setJobArchived as setJobArchivedRequest,
  updateJob as updateJobRequest
} from '@/features/jobs/job-api';
import { type JobFormValues, type JobRow } from '@/features/jobs/types';
import { readErrorMessage } from '@/features/utils';
import {
  trackJobArchived,
  trackJobCreated,
  trackJobDeleted,
  trackJobUpdated
} from '@/lib/analytics-events';

type JobsState = {
  jobs: JobRow[];
  isLoading: boolean;
  error: string | null;
  hasLoaded: boolean;
  refreshJobs: () => Promise<void>;
  /** Drops the loaded flag so the next list view refetches — used when a taxonomy
   *  rename changes labels the list resolves from the server. */
  invalidateJobs: () => void;
  createJob: (values: JobFormValues) => Promise<JobRow>;
  updateJob: (id: string, values: JobFormValues) => Promise<void>;
  setJobArchived: (id: string, archived: boolean) => Promise<void>;
  deleteJob: (id: string) => Promise<void>;
};

export const useJobsStore = create<JobsState>((set, get) => ({
  jobs: [],
  isLoading: false,
  error: null,
  hasLoaded: false,
  async refreshJobs() {
    if (get().isLoading) {
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const data = await listJobs();
      set({ jobs: data, error: null, hasLoaded: true });
    } catch (caughtError) {
      set({ error: readErrorMessage(caughtError), hasLoaded: true });
    } finally {
      set({ isLoading: false });
    }
  },
  invalidateJobs() {
    set({ hasLoaded: false });
  },
  async createJob(values) {
    set({ error: null });

    try {
      const created = await createJobRequest(values);
      set((state) => ({ jobs: [created, ...state.jobs] }));
      trackJobCreated();
      return created;
    } catch (caughtError) {
      const message = readErrorMessage(caughtError);
      set({ error: message });
      throw new Error(message);
    }
  },
  async updateJob(id, values) {
    set({ error: null });

    try {
      const updated = await updateJobRequest(id, values);
      set((state) => ({
        jobs: state.jobs.map((job) => (job.id === id ? updated : job))
      }));
      trackJobUpdated();
    } catch (caughtError) {
      const message = readErrorMessage(caughtError);
      set({ error: message });
      throw new Error(message);
    }
  },
  async setJobArchived(id, archived) {
    set({ error: null });

    try {
      const updated = await setJobArchivedRequest(id, archived);
      set((state) => ({
        jobs: state.jobs.map((job) => (job.id === id ? updated : job))
      }));
      trackJobArchived(archived);
    } catch (caughtError) {
      const message = readErrorMessage(caughtError);
      set({ error: message });
      throw new Error(message);
    }
  },
  async deleteJob(id) {
    set({ error: null });

    try {
      await deleteJobRequest(id);
      set((state) => ({
        jobs: state.jobs.filter((job) => job.id !== id)
      }));
      trackJobDeleted();
    } catch (caughtError) {
      const message = readErrorMessage(caughtError);
      set({ error: message });
      throw new Error(message);
    }
  }
}));
