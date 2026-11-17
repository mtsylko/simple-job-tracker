import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { AnalyticsCard } from '@/features/analytics/components/AnalyticsCard';
import {
  countScale,
  parseIso,
  type SentSeries
} from '@/features/analytics/analytics-stats';
import { cn } from '@/lib/utils';

/** Bars carry their count on top only while there is room to read it. */
const MAX_LABELLED_BINS = 12;
const MAX_X_LABELS = 7;

export function SentOverTimeCard({
  series,
  className
}: {
  series: SentSeries;
  className?: string;
}) {
  const { t, i18n } = useTranslation('analytics');
  const { unit, bins } = series;

  const formatBin = useMemo(() => {
    const spansYears =
      bins.length > 0 &&
      bins[0]!.start.slice(0, 4) !== bins[bins.length - 1]!.start.slice(0, 4);
    const format = new Intl.DateTimeFormat(
      i18n.language,
      unit === 'week'
        ? { day: 'numeric', month: 'short' }
        : { month: 'short', ...(spansYears ? { year: '2-digit' } : {}) }
    );
    return (iso: string) => format.format(parseIso(iso));
  }, [bins, unit, i18n.language]);

  const total = bins.reduce((sum, bin) => sum + bin.count, 0);
  const current = bins[bins.length - 1]?.count ?? 0;
  const average = bins.length > 0 ? total / bins.length : 0;
  const ticks = countScale(Math.max(0, ...bins.map((bin) => bin.count)));
  const top = ticks[ticks.length - 1]!;
  const labelled = bins.length <= MAX_LABELLED_BINS;
  // Counted back from the current bin, so the period in progress is always named.
  const xStep = Math.ceil(bins.length / MAX_X_LABELS);

  const meta = t(unit === 'week' ? 'sent.metaWeek' : 'sent.metaMonth', {
    current,
    average: average.toLocaleString(i18n.language, {
      maximumFractionDigits: 1
    })
  });

  return (
    <AnalyticsCard
      title={t(unit === 'week' ? 'sent.titleWeek' : 'sent.titleMonth')}
      meta={meta}
      className={className}
    >
      <div
        role="img"
        aria-label={t('sent.chartLabel', {
          count: total,
          from: bins.length > 0 ? formatBin(bins[0]!.start) : '',
          to: bins.length > 0 ? formatBin(bins[bins.length - 1]!.start) : ''
        })}
        className="grid min-h-48 flex-1 grid-cols-[auto_minmax(0,1fr)] grid-rows-[1fr_auto] gap-x-2"
      >
        <div className="relative w-7 text-xs text-ink-3">
          {ticks.map((tick) => (
            <span
              key={tick}
              className="num absolute right-0 translate-y-1/2 leading-none"
              style={{ bottom: `${(tick / top) * 100}%` }}
            >
              {tick}
            </span>
          ))}
        </div>

        <div className="relative">
          {ticks.map((tick) => (
            <span
              key={tick}
              aria-hidden
              className={cn(
                'absolute inset-x-0 h-px',
                tick === 0 ? 'bg-warm-line' : 'bg-warm-surface-2'
              )}
              style={{ bottom: `${(tick / top) * 100}%` }}
            />
          ))}
          <div
            className={cn(
              'absolute inset-0 grid',
              bins.length > 20 ? 'gap-x-px' : 'gap-x-2'
            )}
            style={{
              gridTemplateColumns: `repeat(${Math.max(bins.length, 1)}, minmax(0, 1fr))`
            }}
          >
            {bins.map((bin, index) => {
              const height = `${(bin.count / top) * 100}%`;
              const isCurrent = index === bins.length - 1;
              return (
                <div
                  key={bin.start}
                  title={`${formatBin(bin.start)}: ${bin.count}`}
                  className="relative"
                >
                  {bin.count > 0 && (
                    <span
                      className={cn(
                        'absolute inset-x-0 bottom-0 mx-auto max-w-8',
                        isCurrent ? 'bg-clay' : 'bg-clay/40'
                      )}
                      style={{ height }}
                    />
                  )}
                  {labelled && (
                    <span
                      className="num absolute inset-x-0 mb-1 text-center text-xs text-ink-2"
                      style={{ bottom: height }}
                    >
                      {bin.count}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <span />
        <div
          aria-hidden
          className={cn(
            'mt-2 grid text-xs text-ink-3',
            bins.length > 20 ? 'gap-x-px' : 'gap-x-2'
          )}
          style={{
            gridTemplateColumns: `repeat(${Math.max(bins.length, 1)}, minmax(0, 1fr))`
          }}
        >
          {bins.map((bin, index) => {
            const fromEnd = bins.length - 1 - index;
            if (fromEnd % xStep !== 0) return <span key={bin.start} />;
            // A narrow plot keeps every other label, still counted from the current bin.
            const narrowHidden = xStep > 1 && (fromEnd / xStep) % 2 === 1;
            return (
              <span
                key={bin.start}
                className={cn(
                  'num whitespace-nowrap',
                  narrowHidden && 'hidden @lg:block',
                  index === 0
                    ? 'justify-self-start'
                    : fromEnd === 0
                      ? 'justify-self-end'
                      : 'justify-self-center'
                )}
              >
                {formatBin(bin.start)}
              </span>
            );
          })}
        </div>
      </div>
    </AnalyticsCard>
  );
}
