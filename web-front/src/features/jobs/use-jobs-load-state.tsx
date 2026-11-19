import { useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { useJobsStore } from '@/features/jobs/job-store';

export function useJobsLoadState() {
  const { jobs, isFetching, error, hasLoaded, isStale, refreshJobs } =
    useJobsStore(
      useShallow((state) => ({
        jobs: state.jobs,
        isFetching: state.isLoading,
        error: state.error,
        hasLoaded: state.hasLoaded,
        isStale: state.isStale,
        refreshJobs: state.refreshJobs
      }))
    );

  useEffect(() => {
    // A failed first load waits for the retry button rather than looping.
    if (!isFetching && ((!hasLoaded && !error) || isStale)) {
      void refreshJobs();
    }
  }, [error, hasLoaded, isFetching, isStale, refreshJobs]);

  return {
    jobs,
    // Only a list never loaded holds the page; a refetch keeps the rows on screen.
    isLoading: !hasLoaded && !error,
    error: hasLoaded ? null : error,
    isFetching,
    refreshJobs
  };
}
