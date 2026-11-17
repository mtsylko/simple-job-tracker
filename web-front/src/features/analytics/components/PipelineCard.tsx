import { useTranslation } from 'react-i18next';

import { AnalyticsCard } from '@/features/analytics/components/AnalyticsCard';
import type { PipelineCounts } from '@/features/analytics/analytics-stats';
import { cn } from '@/lib/utils';

/** The longest bar stops short of the column, so its end reads as an end. */
const BAR_REACH = 88;

/** A real share that rounds to zero is not shown as nothing. */
function formatShare(count: number, total: number): string {
  if (count === 0 || total === 0) return '0%';
  const pct = Math.round((count / total) * 100);
  return pct === 0 ? '<1%' : `${pct}%`;
}

type Row = { label: string; count: number; closed?: boolean };

export function PipelineCard({
  counts,
  className
}: {
  counts: PipelineCounts;
  className?: string;
}) {
  const { t } = useTranslation('analytics');
  const total = counts.open + counts.closed;

  const rows: Row[] = [
    ...counts.stages,
    ...(counts.unstaged > 0
      ? [{ label: t('pipeline.unstaged'), count: counts.unstaged }]
      : []),
    { label: t('pipeline.closed'), count: counts.closed, closed: true }
  ];
  const max = Math.max(1, ...rows.map((row) => row.count));

  return (
    <AnalyticsCard
      title={t('pipeline.title')}
      meta={t('pipeline.meta', { open: counts.open, closed: counts.closed })}
      className={className}
    >
      <ul className="m-0 flex flex-1 list-none flex-col p-0">
        {rows.map((row) => (
          <li
            key={row.label}
            className={cn(
              'grid min-h-8 flex-1 grid-cols-[minmax(0,7rem)_minmax(0,1fr)_2.5rem_2.75rem] items-center gap-x-3',
              row.closed && 'mt-1 border-t border-warm-surface-2 pt-1'
            )}
          >
            <span className="truncate text-sm text-foreground">
              {row.label}
            </span>
            <span className="flex h-1.5 items-center">
              {row.count > 0 && (
                <span
                  className={cn(
                    'block h-full min-w-0.5 rounded-full',
                    row.closed ? 'bg-ink-3/40' : 'bg-clay'
                  )}
                  style={{ width: `${(row.count / max) * BAR_REACH}%` }}
                />
              )}
            </span>
            <span className="num text-right text-sm font-medium text-foreground">
              {row.count}
            </span>
            <span className="num text-right text-sm text-ink-3">
              {formatShare(row.count, total)}
            </span>
          </li>
        ))}
      </ul>
    </AnalyticsCard>
  );
}
