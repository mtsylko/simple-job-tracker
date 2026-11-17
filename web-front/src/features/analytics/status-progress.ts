import type { JobStatusOption } from '@job-tracker/shared';

import type { JobRow } from '@/features/jobs/types';

/**
 * Statuses are user-defined, so their order is the pipeline: an application
 * starts at the default status, and anything further along counts as progressed.
 */
export type StatusProgress = {
  /** Active statuses in sort order — the funnel's stages. */
  stages: JobStatusOption[];
  /** Label of the last stage, used where "Offer" used to be hard-coded. */
  finalLabel: string | null;
  /** Label of the stage an application starts at. */
  entryLabel: string | null;
  /** Past the entry stage. A job in an archived status matches nothing here. */
  hasProgressed: (job: JobRow) => boolean;
  /** Past the entry stage but not yet at the last one. */
  isInterviewing: (job: JobRow) => boolean;
  isFinal: (job: JobRow) => boolean;
};

export function buildStatusProgress(stages: JobStatusOption[]): StatusProgress {
  const entryIndex = Math.max(
    stages.findIndex((option) => option.isDefault),
    0
  );
  const finalIndex = stages.length - 1;
  const indexOf = (job: JobRow) =>
    stages.findIndex((option) => option.value === job.status);

  return {
    stages,
    finalLabel: finalIndex >= 0 ? stages[finalIndex]!.value : null,
    entryLabel: stages[entryIndex]?.value ?? null,
    hasProgressed: (job) => indexOf(job) > entryIndex,
    isInterviewing: (job) => {
      const index = indexOf(job);
      return index > entryIndex && index < finalIndex;
    },
    isFinal: (job) => finalIndex >= 0 && indexOf(job) === finalIndex
  };
}
