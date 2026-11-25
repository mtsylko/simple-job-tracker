import { Fragment, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { AnalyticsKpis } from '@/features/analytics/components/AnalyticsKpis';
import { AnalyticsRangePicker } from '@/features/analytics/components/AnalyticsRangePicker';
import { ClosedOutcomesCard } from '@/features/analytics/components/ClosedOutcomesCard';
import { CvVersionsCard } from '@/features/analytics/components/CvVersionsCard';
import { PipelineCard } from '@/features/analytics/components/PipelineCard';
import { SentOverTimeCard } from '@/features/analytics/components/SentOverTimeCard';
import {
  binSent,
  countPipeline,
  isClosed,
  MIN_SENT_FOR_RATE,
  parseIso,
  percent,
  summarizeClosed,
  summarizeCvs
} from '@/features/analytics/analytics-stats';
import { buildStatusProgress } from '@/features/analytics/status-progress';
import {
  analyticsRangeCutoff,
  useAnalyticsRange,
  useJobsInRange
} from '@/features/analytics/use-analytics-range';
import type { CvVersionRow } from '@/features/cv-versions/types';
import type { JobRow } from '@/features/jobs/types';
import { useJobStatusOptions } from '@/features/jobs/use-job-status-options';

const DAY_MS = 86_400_000;

function daysSince(iso: string, now: Date): number {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.max(
    0,
    Math.round((today.getTime() - parseIso(iso).getTime()) / DAY_MS)
  );
}

export function AnalyticsPage({
  jobs,
  cvVersions = []
}: {
  jobs: JobRow[];
  cvVersions?: CvVersionRow[];
}) {
  const { t, i18n } = useTranslation('analytics');
  const { range, setRange } = useAnalyticsRange();

  // Every block below reads this, so the range applies from one place.
  const scopedJobs = useJobsInRange(jobs, range);

  // The stages are the user's statuses, so every "past applied" figure is derived from their order.
  const { statusOptions } = useJobStatusOptions();
  const progress = useMemo(
    () => buildStatusProgress(statusOptions),
    [statusOptions]
  );
  const entryLabel = progress.entryLabel ?? '';

  const series = useMemo(
    () => binSent(scopedJobs, analyticsRangeCutoff(range)),
    [scopedJobs, range]
  );
  const pipeline = useMemo(
    () => countPipeline(scopedJobs, progress),
    [scopedJobs, progress]
  );
  const cvSummary = useMemo(
    () => summarizeCvs(scopedJobs, cvVersions, progress.hasProgressed),
    [scopedJobs, cvVersions, progress]
  );
  const closedSummary = useMemo(
    () => summarizeClosed(scopedJobs, progress.hasProgressed),
    [scopedJobs, progress]
  );

  const now = new Date();
  const sent = scopedJobs.length;
  const heard = scopedJobs.filter(progress.hasProgressed).length;
  const openJobs = scopedJobs.filter((job) => !isClosed(job));
  const interviewing = openJobs.filter(progress.isInterviewing);
  const atFinal = openJobs.filter(progress.isFinal);

  const formatDate = (iso: string) =>
    new Intl.DateTimeFormat(i18n.language, {
      day: 'numeric',
      month: 'short',
      ...(iso.slice(0, 4) !== String(now.getFullYear())
        ? { year: 'numeric' }
        : {})
    }).format(parseIso(iso));

  const firstSent = scopedJobs
    .map((job) => job.appliedAt)
    .filter(Boolean)
    .sort()[0];

  const interviewingBreakdown = pipeline.stages
    .filter((stage) => interviewing.some((job) => job.status === stage.label))
    // Each item keeps its separator, so a wrapped line never ends on a "·".
    .map((stage, index) => (
      <Fragment key={stage.label}>
        {index > 0 && ' '}
        <span className="whitespace-nowrap">
          {index > 0 && '· '}
          {stage.label} {stage.count}
        </span>
      </Fragment>
    ));

  const finalDetail = (() => {
    if (atFinal.length === 0) return t('kpi.final.none');
    if (atFinal.length === 1) {
      const job = atFinal[0]!;
      return t('kpi.final.one', {
        company: job.company,
        count: daysSince(job.statusChangedAt, now)
      });
    }
    if (atFinal.length === 2) {
      return t('kpi.final.two', {
        first: atFinal[0]!.company,
        second: atFinal[1]!.company
      });
    }
    return t('kpi.final.many', {
      companies: atFinal
        .slice(0, 2)
        .map((job) => job.company)
        .join(', '),
      count: atFinal.length - 2
    });
  })();

  const finding = (() => {
    if (sent === 0) return t('finding.none');
    const { best } = cvSummary;
    const top = cvSummary.rows[0];
    if (best && top && best !== top && top.sent >= MIN_SENT_FOR_RATE) {
      return t('finding.compare', {
        heard,
        sent,
        best: best.cv,
        bestPct: best.rate,
        topPct: top.rate
      });
    }
    if (best) {
      return t('finding.best', {
        heard,
        sent,
        best: best.cv,
        bestHeard: best.heard,
        bestSent: best.sent
      });
    }
    return t('finding.plain', { heard, sent });
  })();

  return (
    <main className="flex min-h-0 flex-1 flex-col">
      {/* Header inside the scroller, so a scrollbar narrows it and the cards together and they stay aligned. */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="z-10 flex flex-wrap items-end justify-between gap-x-6 gap-y-3 bg-background px-4 pt-5 pb-4 sm:sticky sm:top-0 sm:px-7 sm:pt-7 sm:pb-5">
          <div className="flex min-w-0 flex-col gap-1">
            <h1 className="m-0 font-serif text-display font-light leading-tight tracking-tight text-foreground">
              {t('page.title')}
            </h1>
            <p className="text-sm text-muted-foreground">{finding}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <AnalyticsRangePicker value={range} onChange={setRange} />
          </div>
        </div>

        <div className="@container px-4 pb-20 sm:px-7">
          <div className="flex flex-col gap-4">
            <AnalyticsKpis
              items={[
                {
                  label: t('kpi.sent.label'),
                  value: sent,
                  detail: firstSent
                    ? t('kpi.sent.since', { date: formatDate(firstSent) })
                    : '—'
                },
                {
                  label: t('kpi.heard.label'),
                  value: heard,
                  suffix: `${percent(heard, sent)}%`,
                  detail: t('kpi.heard.detail', { status: entryLabel })
                },
                {
                  label: t('kpi.interviewing.label'),
                  value: interviewing.length,
                  detail:
                    interviewingBreakdown.length > 0
                      ? interviewingBreakdown
                      : t('kpi.interviewing.none')
                },
                {
                  label: progress.finalLabel ?? t('kpi.final.label'),
                  value: atFinal.length,
                  detail: finalDetail
                }
              ]}
            />

            <div className="grid gap-4 @4xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
              <SentOverTimeCard series={series} />
              <PipelineCard counts={pipeline} />
            </div>

            <div className="grid items-start gap-4 @4xl:grid-cols-2">
              <CvVersionsCard summary={cvSummary} />
              <ClosedOutcomesCard
                summary={closedSummary}
                entryLabel={entryLabel}
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
