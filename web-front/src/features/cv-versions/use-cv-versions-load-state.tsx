import { useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { useCvVersionsStore } from '@/features/cv-versions/cv-version-store';

export function useCvVersionsLoadState() {
  const { cvVersions, storeIsLoading, error, hasLoaded, refreshCvVersions } =
    useCvVersionsStore(
      useShallow((state) => ({
        cvVersions: state.cvVersions,
        storeIsLoading: state.isLoading,
        error: state.error,
        hasLoaded: state.hasLoaded,
        refreshCvVersions: state.refreshCvVersions
      }))
    );

  useEffect(() => {
    // A failed first load waits for the retry button rather than looping.
    if (!storeIsLoading && !hasLoaded && !error) {
      void refreshCvVersions();
    }
  }, [error, hasLoaded, refreshCvVersions, storeIsLoading]);

  return {
    cvVersions,
    // Only a list never loaded holds the page; a failed action leaves it on screen.
    isLoading: !hasLoaded && !error,
    error: hasLoaded ? null : error,
    refreshCvVersions
  };
}
