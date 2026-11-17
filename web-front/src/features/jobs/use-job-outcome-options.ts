import { listJobOutcomeOptions } from '@/features/jobs/job-api';
import { useAsyncData } from '@/hooks/use-async-data';

const EMPTY: string[] = [];

/**
 * The user's active outcome labels, in sort order. The form offers them in the
 * outcome dropdown; a job stores the label, so the list needs no lookup.
 */
export function useJobOutcomeOptions() {
  const { data: outcomeOptions, isLoading } = useAsyncData(
    listJobOutcomeOptions,
    EMPTY
  );
  return { outcomeOptions, isLoading };
}
