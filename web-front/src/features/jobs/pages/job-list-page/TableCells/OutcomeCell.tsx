import type { JobRow } from '@/features/jobs/types.ts';

export function OutcomeCell({ outcome }: { outcome: JobRow['outcome'] }) {
  if (!outcome) {
    return <span className="text-muted-foreground">—</span>;
  }

  // Outcome is a user-authored taxonomy label now, so it renders verbatim.
  return <span className="text-foreground/80">{outcome}</span>;
}
