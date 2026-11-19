import { useEffect, useMemo } from 'react';
import type { JobTaxonomyOption } from '@job-tracker/shared';

import { useTaxonomyStore } from '@/features/taxonomies/taxonomy-store';

function labels(options: JobTaxonomyOption[]): string[] {
  return options.map((option) => option.value);
}

/** The active labels of each form taxonomy in the user's order, read from the shared store instead of fetched per form. */
export function useJobTaxonomyOptions() {
  const taxonomy = useTaxonomyStore((store) => store.taxonomy);
  const ensureLoaded = useTaxonomyStore((store) => store.ensureLoaded);

  useEffect(() => {
    ensureLoaded();
  }, [ensureLoaded]);

  return useMemo(
    () => ({
      roleOptions: labels(taxonomy.role.options),
      levelOptions: labels(taxonomy.level.options),
      typeOptions: labels(taxonomy.type.options),
      employmentTypeOptions: labels(taxonomy.employmentType.options),
      contractTypeOptions: labels(taxonomy.contractType.options)
    }),
    [taxonomy]
  );
}
