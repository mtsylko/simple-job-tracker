import { useTranslation } from 'react-i18next';
import type { CompanySummary } from '@job-tracker/shared';

import { TableCell, TableRow } from '@/components/ui/table';
import { CompanyName } from '@/features/companies/components/CompanyName';
import { CompanyRowMenu } from '@/features/companies/components/CompanyRowMenu';
import { hasApplications } from '@/features/companies/company-paths';
import { companyTypeKey } from '@/features/companies/company-type';
import { formatDisplayDate } from '@/lib/format-date';
import { ROW_OPEN_CLASS, rowOpenHandlers } from '@/lib/row-open';
import { cn } from '@/lib/utils';

export function BlacklistRow({
  company,
  onEditReason,
  onRemove
}: {
  company: CompanySummary;
  onEditReason: (company: CompanySummary) => void;
  onRemove: (company: CompanySummary) => void;
}) {
  const { t } = useTranslation('companies');
  const savedReason = company.blacklist?.reason ?? null;
  const blacklistedAt = company.blacklist?.blacklistedAt;

  const reasonText = savedReason ? (
    <span className="truncate text-ink-3" title={savedReason}>
      {savedReason}
    </span>
  ) : (
    <span className="truncate text-muted-foreground">
      {t('blacklisted.noReason')}
    </span>
  );

  return (
    <TableRow
      {...(hasApplications(company) ? rowOpenHandlers : {})}
      className={cn(
        'border-warm-line',
        hasApplications(company) ? ROW_OPEN_CLASS : 'hover:bg-transparent'
      )}
    >
      <TableCell className="pl-5">
        {/* Phones hide the reason column, so its subline carries the reason instead of the type */}
        <CompanyName company={company}>
          <span className="flex min-w-0 sm:hidden">{reasonText}</span>
          <span className="hidden truncate sm:inline">
            {t(companyTypeKey(company))}
          </span>
        </CompanyName>
      </TableCell>

      <TableCell className="hidden text-sm sm:table-cell">
        <div className="flex min-w-0">{reasonText}</div>
      </TableCell>

      <TableCell className="num hidden text-sm text-foreground/80 lg:table-cell">
        {blacklistedAt ? formatDisplayDate(blacklistedAt.slice(0, 10)) : '—'}
      </TableCell>

      <TableCell className="py-1.5 pr-3">
        <CompanyRowMenu
          company={company}
          onToggleBlacklist={onRemove}
          onEditReason={onEditReason}
        />
      </TableCell>
    </TableRow>
  );
}
