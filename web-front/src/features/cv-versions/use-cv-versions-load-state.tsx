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
    if (!hasLoaded && !storeIsLoading) {
      void refreshCvVersions();
    }
  }, [hasLoaded, refreshCvVersions, storeIsLoading]);

  return {
    cvVersions,
    isLoading: storeIsLoading || !hasLoaded,
    error,
    refreshCvVersions
  };
}
