import { useEffect, useMemo } from 'react';

import { useTaxonomyStore } from '@/features/taxonomies/taxonomy-store';

/**
 * The user's active outcome labels, in sort order. The form offers them in the
 * outcome dropdown; a job stores the label, so the list needs no lookup.
 */
export function useJobOutcomeOptions() {
  const outcome = useTaxonomyStore((store) => store.taxonomy.outcome);
  const ensureLoaded = useTaxonomyStore((store) => store.ensureLoaded);

  useEffect(() => {
    ensureLoaded();
  }, [ensureLoaded]);

  const outcomeOptions = useMemo(
    () => outcome.options.map((option) => option.value),
    [outcome.options]
  );
  return { outcomeOptions, isLoading: outcome.isLoading };
}
