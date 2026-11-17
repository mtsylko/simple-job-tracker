import type { CvVersionRow } from '@/features/cv-versions/types';
import type { JobRow } from '@/features/jobs/types';
import type { StatusProgress } from '@/features/analytics/status-progress';
import { toIsoDate } from '@/features/analytics/use-analytics-range';

/** Below this many applications a CV's reply rate is noise, so it is not ranked. */
export const MIN_SENT_FOR_RATE = 3;

/** An outcome ("why it ended") is set, whatever stage the application reached. */
export function isClosed(job: JobRow): boolean {
  return job.outcome !== '';
}

export function percent(part: number, whole: number): number {
  return whole > 0 ? Math.round((part / whole) * 100) : 0;
}

export type StageCount = { label: string; count: number };

export type PipelineCounts = {
  /** Open applications per stage, in the user's order. */
  stages: StageCount[];
  /** Open applications whose status has since been archived. */
  unstaged: number;
  open: number;
  closed: number;
};

/** Every application lands in exactly one row, so the rows sum to the total. */
export function countPipeline(
  jobs: JobRow[],
  progress: StatusProgress
): PipelineCounts {
  const openJobs = jobs.filter((job) => !isClosed(job));
  const stages = progress.stages.map((option) => ({
    label: option.value,
    count: openJobs.filter((job) => job.status === option.value).length
  }));
  const staged = stages.reduce((sum, stage) => sum + stage.count, 0);

  return {
    stages,
    unstaged: openJobs.length - staged,
    open: openJobs.length,
    closed: jobs.length - openJobs.length
  };
}

export type CvStat = {
  cv: string;
  sent: number;
  heard: number;
  rate: number;
  isDisabled: boolean;
  /** Null when the applications name a version that no longer exists. */
  versionId: string | null;
};

export type CvSummary = {
  /** Most sent first. */
  rows: CvStat[];
  sentWithCv: number;
  heardWithCv: number;
  withoutCv: number;
  /** Highest reply rate among versions sent often enough to rank. */
  best: CvStat | null;
};

export function summarizeCvs(
  jobs: JobRow[],
  cvVersions: CvVersionRow[],
  hasProgressed: (job: JobRow) => boolean
): CvSummary {
  const map = new Map<string, { sent: number; heard: number }>();
  let withoutCv = 0;

  for (const job of jobs) {
    const cv = job.cv.trim();
    if (!cv) {
      withoutCv++;
      continue;
    }
    const entry = map.get(cv) ?? { sent: 0, heard: 0 };
    entry.sent++;
    if (hasProgressed(job)) entry.heard++;
    map.set(cv, entry);
  }

  const rows = Array.from(map.entries())
    .map(([cv, entry]) => {
      const version = cvVersions.find((v) => v.name.trim() === cv);
      return {
        cv,
        sent: entry.sent,
        heard: entry.heard,
        rate: percent(entry.heard, entry.sent),
        isDisabled: version ? !version.enabled : false,
        versionId: version?.id ?? null
      };
    })
    .sort((a, b) => b.sent - a.sent || a.cv.localeCompare(b.cv));

  const best = rows
    .filter((row) => row.sent >= MIN_SENT_FOR_RATE && row.heard > 0)
    .reduce<CvStat | null>(
      (top, row) =>
        !top ||
        row.rate > top.rate ||
        (row.rate === top.rate && row.sent > top.sent)
          ? row
          : top,
      null
    );

  return {
    rows,
    sentWithCv: rows.reduce((sum, row) => sum + row.sent, 0),
    heardWithCv: rows.reduce((sum, row) => sum + row.heard, 0),
    withoutCv,
    best
  };
}

export type ClosedRow = {
  outcome: string;
  atEntry: number;
  past: number;
  total: number;
};

export type ClosedSummary = {
  /** Most frequent outcome first. */
  rows: ClosedRow[];
  atEntry: number;
  past: number;
  total: number;
};

/** Where each closed application had got to: still at the entry stage, or past it. */
export function summarizeClosed(
  jobs: JobRow[],
  hasProgressed: (job: JobRow) => boolean
): ClosedSummary {
  const map = new Map<string, ClosedRow>();

  for (const job of jobs) {
    if (!isClosed(job)) continue;
    const row = map.get(job.outcome) ?? {
      outcome: job.outcome,
      atEntry: 0,
      past: 0,
      total: 0
    };
    if (hasProgressed(job)) row.past++;
    else row.atEntry++;
    row.total++;
    map.set(job.outcome, row);
  }

  const rows = Array.from(map.values()).sort(
    (a, b) => b.total - a.total || a.outcome.localeCompare(b.outcome)
  );

  return {
    rows,
    atEntry: rows.reduce((sum, row) => sum + row.atEntry, 0),
    past: rows.reduce((sum, row) => sum + row.past, 0),
    total: rows.reduce((sum, row) => sum + row.total, 0)
  };
}

export type SentBin = {
  /** First day of the week or month, as `YYYY-MM-DD`. */
  start: string;
  count: number;
};

export type SentSeries = {
  unit: 'week' | 'month';
  /** Oldest first; the last bin is the current, unfinished one. */
  bins: SentBin[];
};

/** Up to this many weeks the series is weekly; longer windows go monthly. */
const MAX_WEEKLY_BINS = 39;

const DAY_MS = 86_400_000;

/** Days since the epoch for a `YYYY-MM-DD` date, free of DST and time zone. */
function dayNumber(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  return Date.UTC(y!, m! - 1, d!) / DAY_MS;
}

function isoFromDay(day: number): string {
  return new Date(day * DAY_MS).toISOString().slice(0, 10);
}

/** Monday on or before the day. */
function weekStart(day: number): number {
  const weekday = new Date(day * DAY_MS).getUTCDay();
  return day - ((weekday + 6) % 7);
}

/** A `YYYY-MM-DD` date as local midnight. */
export function parseIso(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y!, m! - 1, d!);
}

/**
 * Applications sent per week or month, from the window's start (or the first
 * application, when unbounded) to today, with empty periods kept as zeros.
 */
export function binSent(
  jobs: JobRow[],
  cutoff: string | null,
  now: Date = new Date()
): SentSeries {
  const dated = jobs.map((job) => job.appliedAt).filter(Boolean);
  const today = dayNumber(toIsoDate(now));
  const first =
    cutoff ??
    dated.reduce((min, iso) => (iso < min ? iso : min), toIsoDate(now));

  const firstWeek = weekStart(dayNumber(first));
  const weekCount = Math.floor((weekStart(today) - firstWeek) / 7) + 1;

  if (weekCount <= MAX_WEEKLY_BINS) {
    const bins = Array.from({ length: weekCount }, (_, i) => ({
      start: isoFromDay(firstWeek + i * 7),
      count: 0
    }));
    for (const iso of dated) {
      const index = Math.floor((dayNumber(iso) - firstWeek) / 7);
      if (index >= 0 && index < bins.length) bins[index]!.count++;
    }
    return { unit: 'week', bins };
  }

  const [y0, m0] = first.split('-').map(Number);
  const monthIndex = (iso: string) => {
    const [y, m] = iso.split('-').map(Number);
    return (y! - y0!) * 12 + (m! - m0!);
  };
  const monthCount = monthIndex(toIsoDate(now)) + 1;
  const bins = Array.from({ length: monthCount }, (_, i) => {
    const date = new Date(Date.UTC(y0!, m0! - 1 + i, 1));
    return { start: date.toISOString().slice(0, 10), count: 0 };
  });
  for (const iso of dated) {
    const index = monthIndex(iso);
    if (index >= 0 && index < bins.length) bins[index]!.count++;
  }
  return { unit: 'month', bins };
}

/** Round, even steps whose top sits above the maximum; integers only, as these are counts. */
export function countScale(max: number): number[] {
  const target = Math.max(max, 3);
  const steps: number[] = [];
  for (let power = 1; power <= 1e6; power *= 10) {
    steps.push(power, 2 * power, 5 * power);
    if (power >= 10) steps.push(2.5 * power);
  }
  steps.sort((a, b) => a - b);

  const step = steps.find((s) => Math.floor(target / s) + 1 <= 4) ?? 1e6;
  const top = (Math.floor(target / step) + 1) * step;
  return Array.from({ length: top / step + 1 }, (_, i) => i * step);
}
