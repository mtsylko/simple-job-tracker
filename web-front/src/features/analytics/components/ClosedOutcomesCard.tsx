import { useTranslation } from 'react-i18next';

import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { AnalyticsCard } from '@/features/analytics/components/AnalyticsCard';
import type { ClosedSummary } from '@/features/analytics/analytics-stats';
import { cn } from '@/lib/utils';

const EDGE_CELL = 'first:pl-5 last:pr-5';
const HEAD = cn('h-9 text-xs font-normal text-ink-3', EDGE_CELL);
const NUM = cn('num text-right', EDGE_CELL);

export function ClosedOutcomesCard({
  summary,
  entryLabel,
  className
}: {
  summary: ClosedSummary;
  entryLabel: string;
  className?: string;
}) {
  const { t } = useTranslation('analytics');

  return (
    <AnalyticsCard
      title={t('closed.title')}
      meta={
        summary.total > 0
          ? t('closed.meta', { count: summary.total })
          : undefined
      }
      className={className}
    >
      {summary.total === 0 ? (
        <p className="m-0 text-sm text-ink-3">{t('closed.empty')}</p>
      ) : (
        <>
          <div className="-mx-5">
            <Table>
              <TableHeader className="bg-transparent [&_tr]:border-b-0">
                <TableRow className="border-b-0 hover:bg-transparent">
                  <TableHead className={HEAD}>
                    {t('closed.columns.outcome')}
                  </TableHead>
                  <TableHead className={cn(HEAD, 'w-px text-right')}>
                    {t('closed.columns.atEntry', { status: entryLabel })}
                  </TableHead>
                  <TableHead className={cn(HEAD, 'w-px text-right')}>
                    {t('closed.columns.past', { status: entryLabel })}
                  </TableHead>
                  <TableHead className={cn(HEAD, 'w-px text-right')}>
                    {t('closed.columns.total')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.rows.map((row) => (
                  <TableRow
                    key={row.outcome}
                    className="h-12 border-t border-b-0 border-warm-surface-2 hover:bg-transparent"
                  >
                    <TableCell className={cn('whitespace-normal', EDGE_CELL)}>
                      {row.outcome}
                    </TableCell>
                    <TableCell className={NUM}>{row.atEntry}</TableCell>
                    <TableCell className={NUM}>{row.past}</TableCell>
                    <TableCell className={cn(NUM, 'font-medium')}>
                      {row.total}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter className="border-t border-warm-line bg-transparent font-normal text-ink-2">
                <TableRow className="h-11 border-b-0 hover:bg-transparent">
                  <TableCell className={EDGE_CELL}>
                    {t('closed.total')}
                  </TableCell>
                  <TableCell className={NUM}>{summary.atEntry}</TableCell>
                  <TableCell className={NUM}>{summary.past}</TableCell>
                  <TableCell className={NUM}>{summary.total}</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
          <p className="m-0 mt-3 text-sm text-ink-2">
            {t('closed.finding', {
              count: summary.atEntry,
              total: summary.total,
              status: entryLabel
            })}
          </p>
        </>
      )}
    </AnalyticsCard>
  );
}
