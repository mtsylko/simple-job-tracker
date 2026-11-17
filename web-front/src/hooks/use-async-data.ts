import { useEffect, useState } from 'react';

/**
 * Loads a value once on mount and reports loading state. The mounted guard —
 * kept here, in one place, rather than repeated in every caller — stops a late
 * response from setting state after the component unmounts, and falls back to
 * `initial` if the load rejects.
 *
 * `load` must be a stable reference (a module-level function): it is the only
 * effect dependency, so an inline closure would refetch on every render.
 */
export function useAsyncData<T>(load: () => Promise<T>, initial: T) {
  const [data, setData] = useState<T>(initial);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    load()
      .then((value) => {
        if (active) setData(value);
      })
      .catch(() => {
        if (active) setData(initial);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
    // `initial` is the reset fallback, deliberately not a trigger to refetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load]);

  return { data, isLoading };
}
