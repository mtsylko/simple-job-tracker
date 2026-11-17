import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { cvVersionEditPath } from '@/app/routes';
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
import {
  MIN_SENT_FOR_RATE,
  percent,
  type CvStat,
  type CvSummary
} from '@/features/analytics/analytics-stats';
import {
  ROW_OPEN_CLASS,
  ROW_OPENER,
  ROW_OPENER_CLASS,
  rowOpenHandlers
} from '@/lib/row-open';
import { cn } from '@/lib/utils';

const COLLAPSED_ROW_COUNT = 5;

// The table runs to the card's edges so a row's hover fill does too.
const EDGE_CELL = 'first:pl-5 last:pr-5';
const HEAD = cn('h-9 text-xs font-normal text-ink-3', EDGE_CELL);
const NUM = 'num text-right';

function RateCell({ row, isBest }: { row: CvStat; isBest: boolean }) {
  const { t } = useTranslation('analytics');

  if (row.sent < MIN_SENT_FOR_RATE) {
    return <span className="text-xs text-ink-3">{t('cvs.tooFew')}</span>;
  }

  return (
    <span className="inline-flex items-center justify-end gap-2.5">
      <span className="relative hidden h-0.5 w-16 bg-warm-surface-2 @lg:block">
        <span
          className={cn(
            'absolute inset-y-0 left-0',
            isBest ? 'bg-foreground' : 'bg-ink-3/50'
          )}
          style={{ width: `${row.rate}%` }}
        />
      </span>
      <span
        className={cn(
          'num min-w-9 text-right',
          isBest ? 'font-medium text-foreground' : 'text-ink-2'
        )}
      >
        {row.rate}%
      </span>
    </span>
  );
}

export function CvVersionsCard({
  summary,
  className
}: {
  summary: CvSummary;
  className?: string;
}) {
  const { t } = useTranslation('analytics');
  const [expanded, setExpanded] = useState(false);
  const { rows, best } = summary;

  const disabledCount = rows.filter((row) => row.isDisabled).length;
  // Collapsed keeps the most sent plus the best one, which the page's finding names.
  const collapsedRows = rows.filter(
    (row, index) => index < COLLAPSED_ROW_COUNT || row === best
  );
  const hiddenCount = rows.length - collapsedRows.length;
  const visibleRows = expanded ? rows : collapsedRows;

  const meta =
    rows.length > 0
      ? t('cvs.meta', { count: rows.length }) +
        (disabledCount > 0
          ? t('cvs.metaDisabled', { count: disabledCount })
          : '')
      : undefined;

  return (
    <AnalyticsCard title={t('cvs.title')} meta={meta} className={className}>
      {rows.length === 0 ? (
        <p className="m-0 text-sm text-ink-3">{t('cvs.empty')}</p>
      ) : (
        <>
          <div className="-mx-5">
            <Table>
              <TableHeader className="bg-transparent [&_tr]:border-b-0">
                <TableRow className="border-b-0 hover:bg-transparent">
                  <TableHead className={HEAD}>{t('cvs.columns.cv')}</TableHead>
                  <TableHead className={cn(HEAD, 'w-px text-right')}>
                    {t('cvs.columns.sent')}
                  </TableHead>
                  <TableHead className={cn(HEAD, 'w-px text-right')}>
                    {t('cvs.columns.heard')}
                  </TableHead>
                  <TableHead className={cn(HEAD, 'w-px text-right @lg:w-36')}>
                    {t('cvs.columns.rate')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleRows.map((row) => {
                  const { versionId } = row;
                  const nameClass = cn(
                    'block truncate',
                    row.isDisabled ? 'text-ink-3' : 'text-foreground',
                    row === best && 'font-medium'
                  );

                  return (
                    <TableRow
                      key={row.cv}
                      // Renamed or deleted versions have nothing to open
                      {...(versionId ? rowOpenHandlers : {})}
                      className={cn(
                        'h-12 border-t border-b-0 border-warm-surface-2',
                        versionId ? ROW_OPEN_CLASS : 'hover:bg-transparent'
                      )}
                    >
                      <TableCell className={cn('max-w-0 py-1.5', EDGE_CELL)}>
                        {versionId ? (
                          <Link
                            to={cvVersionEditPath(versionId)}
                            {...ROW_OPENER}
                            className={cn(nameClass, ROW_OPENER_CLASS)}
                          >
                            {row.cv}
                          </Link>
                        ) : (
                          <span className={nameClass}>{row.cv}</span>
                        )}
                        {row.isDisabled && (
                          <span className="block text-xs text-ink-3">
                            {t('cvs.disabled')}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className={cn(NUM, EDGE_CELL)}>
                        {row.sent}
                      </TableCell>
                      <TableCell className={cn(NUM, EDGE_CELL)}>
                        {row.heard}
                      </TableCell>
                      <TableCell className={cn('text-right', EDGE_CELL)}>
                        <RateCell row={row} isBest={row === best} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
              <TableFooter className="border-t border-warm-line bg-transparent font-normal text-ink-2">
                <TableRow className="h-11 border-b-0 hover:bg-transparent">
                  <TableCell className={EDGE_CELL}>{t('cvs.total')}</TableCell>
                  <TableCell className={cn(NUM, EDGE_CELL)}>
                    {summary.sentWithCv}
                  </TableCell>
                  <TableCell className={cn(NUM, EDGE_CELL)}>
                    {summary.heardWithCv}
                  </TableCell>
                  <TableCell className={cn(NUM, EDGE_CELL)}>
                    {percent(summary.heardWithCv, summary.sentWithCv)}%
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>

          {(summary.withoutCv > 0 || hiddenCount > 0) && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-sm text-ink-3">
              <span>
                {summary.withoutCv > 0 &&
                  t('cvs.withoutCv', { count: summary.withoutCv })}
              </span>
              {hiddenCount > 0 && (
                <button
                  type="button"
                  aria-expanded={expanded}
                  onClick={() => setExpanded((value) => !value)}
                  className="flex shrink-0 cursor-pointer items-center gap-1 rounded-sm text-ink-2 transition-colors hover:text-foreground"
                >
                  {expanded
                    ? t('cvs.showLess')
                    : t('cvs.showMore', { count: hiddenCount })}
                  {expanded ? (
                    <ChevronUp className="size-4" />
                  ) : (
                    <ChevronDown className="size-4" />
                  )}
                </button>
              )}
            </div>
          )}
        </>
      )}
    </AnalyticsCard>
  );
}
