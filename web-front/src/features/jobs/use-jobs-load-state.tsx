import { useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { useJobsStore } from '@/features/jobs/job-store';

export function useJobsLoadState() {
  const { jobs, storeIsLoading, error, hasLoaded, refreshJobs } = useJobsStore(
    useShallow((state) => ({
      jobs: state.jobs,
      storeIsLoading: state.isLoading,
      error: state.error,
      hasLoaded: state.hasLoaded,
      refreshJobs: state.refreshJobs
    }))
  );

  useEffect(() => {
    if (!hasLoaded && !storeIsLoading) {
      void refreshJobs();
    }
  }, [hasLoaded, refreshJobs, storeIsLoading]);

  return {
    jobs,
    isLoading: storeIsLoading || !hasLoaded,
    error,
    refreshJobs
  };
}
