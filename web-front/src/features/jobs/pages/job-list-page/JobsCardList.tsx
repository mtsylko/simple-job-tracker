import { useTranslation } from 'react-i18next';

import { formatDisplayDate } from '@/lib/format-date';
import type { JobRow } from '@/features/jobs/types';
import { useInfiniteScrollBatches } from '@/hooks/use-infinite-scroll-batches';
import { rowOpenHandlers, ROW_OPEN_CLASS } from '@/lib/row-open';
import { cn } from '@/lib/utils';

import { CompanyCell } from './TableCells/CompanyCell';
import { RowMenu } from './TableCells/RowMenu';
import { StatusBadge } from './TableCells/StatusBadge';
import { EmptyResult } from './EmptyResult';

/** Rows revealed per batch as the list is scrolled. */
const SCROLL_BATCH_SIZE = 50;

/** The phone view of the applications list: one stacked card per application. */
export function JobsCardList({
  jobs,
  showArchivedMarker,
  busyJobId,
  onEdit,
  onToggleArchive,
  onBlacklistCompany,
  onDelete
}: {
  jobs: JobRow[];
  showArchivedMarker: boolean;
  busyJobId: string | null;
  onEdit: (id: string) => void;
  onToggleArchive: (row: JobRow) => void;
  onBlacklistCompany: (row: JobRow) => void;
  onDelete: (row: JobRow) => void;
}) {
  const { t } = useTranslation('jobs');
  const { sentinelRef, visibleCount, hasMore } = useInfiniteScrollBatches({
    enabled: true,
    totalCount: jobs.length,
    batchSize: SCROLL_BATCH_SIZE
  });

  if (jobs.length === 0) {
    return <EmptyResult />;
  }

  const visibleJobs = jobs.slice(0, visibleCount);

  return (
    // One panel with hairlines, like the table it replaces, not a box per job
    <ul className="mb-4 divide-y divide-warm-line overflow-hidden rounded-xl border border-warm-line bg-warm-surface">
      {visibleJobs.map((job) => (
        <li key={job.id}>
          {/* The company name opens the card; a tap anywhere else is forwarded to it, the menu and markers keep their own */}
          <div {...rowOpenHandlers} className={cn('p-3.5', ROW_OPEN_CLASS)}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <CompanyCell
                  row={job}
                  showArchivedMarker={showArchivedMarker}
                />
              </div>
              <div className="-mt-2.5 -mr-3 shrink-0">
                <RowMenu
                  row={job}
                  disabled={busyJobId === job.id}
                  // A thumb-sized target; the margins keep the dots where they were
                  triggerClassName="size-9"
                  onEdit={onEdit}
                  onToggleArchive={onToggleArchive}
                  onBlacklistCompany={onBlacklistCompany}
                  onDelete={onDelete}
                />
              </div>
            </div>

            <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
              {job.status && (
                <StatusBadge status={job.status} color={job.statusColor} />
              )}
              {job.appliedAt && (
                <span className="num">{formatDisplayDate(job.appliedAt)}</span>
              )}
              {job.role && <span className="truncate">{job.role}</span>}
            </div>
          </div>
        </li>
      ))}

      {hasMore && (
        <li>
          <div ref={sentinelRef} className="py-3 text-center">
            <span className="num text-xs text-muted-foreground">
              {t('list.table.loadedCount', {
                count: visibleCount,
                total: jobs.length
              })}
            </span>
          </div>
        </li>
      )}
    </ul>
  );
}
