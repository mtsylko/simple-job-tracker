import { useEffect } from 'react';

import { useTaxonomyStore } from '@/features/taxonomies/taxonomy-store';

/**
 * The user's active status options (label, colour, tab flag), in sort order.
 * The form offers them as pickable chips, the list builds its tabs from them,
 * and analytics derives its pipeline stages; a row carries its own resolved
 * colour, so badges do not need this.
 *
 * Backed by the shared taxonomy store, so a revisit paints the cached options
 * on the first frame instead of an empty set that then fills in (which made the
 * analytics pipeline blink on refresh or tab switch).
 */
export function useJobStatusOptions() {
  const status = useTaxonomyStore((store) => store.status);
  const ensureLoaded = useTaxonomyStore((store) => store.ensureLoaded);

  useEffect(() => {
    ensureLoaded();
  }, [ensureLoaded]);

  return { statusOptions: status.options, isLoading: status.isLoading };
}
