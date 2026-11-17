import { Ban } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { CompanySummary } from '@job-tracker/shared';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { BlacklistedMarker } from '@/features/companies/components/BlacklistedMarker';
import { CompanyName } from '@/features/companies/components/CompanyName';
import { hasApplications } from '@/features/companies/company-paths';
import { companyTypeKey } from '@/features/companies/company-type';
import { StatusBadge } from '@/features/jobs/pages/job-list-page/TableCells/StatusBadge';
import { formatDisplayDate } from '@/lib/format-date';
import { ROW_OPEN_CLASS, rowOpenHandlers } from '@/lib/row-open';
import { cn } from '@/lib/utils';

export function CompaniesTable({
  companies,
  emptyMessage,
  onBlacklist,
  onUnblacklist
}: {
  companies: CompanySummary[];
  emptyMessage: string;
  onBlacklist: (company: CompanySummary) => void;
  onUnblacklist: (company: CompanySummary) => void;
}) {
  const { t } = useTranslation('companies');

  if (companies.length === 0) {
    return (
      <p className="px-5 py-4 text-sm text-muted-foreground">{emptyMessage}</p>
    );
  }

  return (
    // Fixed layout: the one column without a width (company, or roles on xl) takes the rest.
    <Table className="table-fixed">
      <TableHeader className="bg-transparent">
        <TableRow className="border-warm-line hover:bg-transparent">
          <TableHead className="pl-5 xl:w-[280px]">
            {t('list.company')}
          </TableHead>
          <TableHead className="hidden w-36 sm:table-cell">
            {t('list.latestStatus')}
          </TableHead>
          <TableHead className="hidden xl:table-cell">
            {t('list.roles')}
          </TableHead>
          <TableHead className="w-32 text-center">
            {t('list.applications')}
          </TableHead>
          <TableHead className="hidden w-32 lg:table-cell">
            {t('list.lastApplied')}
          </TableHead>
          <TableHead className="w-14 pr-3">
            <span className="sr-only">{t('list.actions')}</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {companies.map((company) => (
          <TableRow
            key={company.id ?? company.name}
            {...(hasApplications(company) ? rowOpenHandlers : {})}
            className={cn(
              'border-warm-line',
              hasApplications(company) ? ROW_OPEN_CLASS : 'hover:bg-transparent'
            )}
          >
            <TableCell className="pl-5">
              <CompanyName company={company}>
                {company.blacklist && (
                  <>
                    <BlacklistedMarker blacklist={company.blacklist} />
                    <span aria-hidden="true">·</span>
                  </>
                )}
                <span className="truncate">{t(companyTypeKey(company))}</span>
              </CompanyName>
            </TableCell>
            <TableCell className="hidden sm:table-cell">
              {company.latestStatus ? (
                <StatusBadge
                  status={company.latestStatus.value}
                  color={company.latestStatus.color}
                />
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </TableCell>
            <TableCell
              className="hidden truncate text-sm text-ink-3 xl:table-cell"
              title={company.roles.join(', ')}
            >
              {company.roles.length > 0 ? (
                company.roles.join(', ')
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </TableCell>
            <TableCell className="num text-center text-sm text-foreground/80">
              {company.applicationCount}
            </TableCell>
            <TableCell className="num hidden text-sm text-foreground/80 lg:table-cell">
              {company.lastAppliedAt ? (
                formatDisplayDate(company.lastAppliedAt.slice(0, 10))
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </TableCell>
            <TableCell className="py-1.5 pr-3">
              <div className="flex justify-end">
                <button
                  type="button"
                  className="cv-icon-btn"
                  aria-pressed={company.blacklist !== null}
                  title={t(
                    company.blacklist
                      ? 'list.unblacklistAction'
                      : 'list.blacklistAction'
                  )}
                  onClick={() =>
                    company.blacklist
                      ? onUnblacklist(company)
                      : onBlacklist(company)
                  }
                >
                  {/* The button's unlayered colour beats utilities, so the on state colours the icon */}
                  <Ban
                    className={cn(
                      'size-4',
                      company.blacklist && 'text-danger-ink'
                    )}
                    aria-hidden="true"
                  />
                </button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
