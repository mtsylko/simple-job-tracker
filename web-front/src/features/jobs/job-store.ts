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
import i18n from '@/i18n';
import {
  trackJobArchived,
  trackJobCreated,
  trackJobDeleted,
  trackJobUpdated
} from '@/lib/analytics-events';
import { notify } from '@/lib/notifications';

type JobsState = {
  jobs: JobRow[];
  /** A list request is in flight. */
  isLoading: boolean;
  /** Why the list could not be loaded; a failed mutation is reported to its caller instead. */
  error: string | null;
  /** `jobs` holds a list fetched from the API. */
  hasLoaded: boolean;
  /** The list changed on the server, so the next list view refetches it behind the rows on screen. */
  isStale: boolean;
  refreshJobs: () => Promise<void>;
  /** Marks the list stale, e.g. after a taxonomy rename changes labels the list resolves from the server. */
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
  isStale: false,
  async refreshJobs() {
    if (get().isLoading) {
      return;
    }

    set({ isLoading: true, isStale: false, error: null });

    try {
      const data = await listJobs();
      set({ jobs: data, hasLoaded: true });
    } catch (caughtError) {
      const message = readErrorMessage(caughtError);
      set({ error: message });
      // The rows on screen stay; only the background refresh failed.
      if (get().hasLoaded) {
        notify.error(
          i18n.t('route.refreshErrorTitle', { ns: 'jobs' }),
          message
        );
      }
    } finally {
      set({ isLoading: false });
    }
  },
  invalidateJobs() {
    set({ isStale: true });
  },
  async createJob(values) {
    try {
      const created = await createJobRequest(values);
      set((state) => ({ jobs: [created, ...state.jobs] }));
      trackJobCreated();
      return created;
    } catch (caughtError) {
      throw new Error(readErrorMessage(caughtError));
    }
  },
  async updateJob(id, values) {
    try {
      const updated = await updateJobRequest(id, values);
      set((state) => ({
        jobs: state.jobs.map((job) => (job.id === id ? updated : job))
      }));
      trackJobUpdated();
    } catch (caughtError) {
      throw new Error(readErrorMessage(caughtError));
    }
  },
  async setJobArchived(id, archived) {
    try {
      const updated = await setJobArchivedRequest(id, archived);
      set((state) => ({
        jobs: state.jobs.map((job) => (job.id === id ? updated : job))
      }));
      trackJobArchived(archived);
    } catch (caughtError) {
      throw new Error(readErrorMessage(caughtError));
    }
  },
  async deleteJob(id) {
    try {
      await deleteJobRequest(id);
      set((state) => ({
        jobs: state.jobs.filter((job) => job.id !== id)
      }));
      trackJobDeleted();
    } catch (caughtError) {
      throw new Error(readErrorMessage(caughtError));
    }
  }
}));
