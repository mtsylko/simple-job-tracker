import { useTranslation } from 'react-i18next';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { formatDisplayDate } from '@/lib/format-date';
import { isArchived, type JobRow } from '@/features/jobs/types.ts';
import { useCompanyBlacklist } from '@/features/companies/blacklist-store';
import { BlacklistedMarker } from '@/features/companies/components/BlacklistedMarker';
import { JobOpenLink } from './JobOpenLink';

/**
 * `showArchivedMarker` is on only when the list mixes active and archived rows.
 * In the archive view every row would carry the same marker.
 */
export function CompanyCell({
  row,
  showArchivedMarker
}: {
  row: JobRow;
  showArchivedMarker: boolean;
}) {
  const { t } = useTranslation('jobs');
  const blacklist = useCompanyBlacklist(row.company);

  return (
    <div className="flex h-full items-center">
      <div className="min-w-0 leading-tight">
        <JobOpenLink
          id={row.id}
          className="block truncate text-sm font-medium text-foreground"
        >
          {row.company}
        </JobOpenLink>
        {/* The marker leads the line so it lines up across rows. Trailing it,
            it started wherever the company type happened to end. */}
        <div className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
          {blacklist && (
            <>
              <BlacklistedMarker blacklist={blacklist} />
              <span aria-hidden="true">·</span>
            </>
          )}
          {showArchivedMarker && isArchived(row) && (
            <>
              <Tooltip>
                <TooltipTrigger className="shrink-0 font-medium text-muted-foreground">
                  {t('list.table.archivedMarker')}
                </TooltipTrigger>
                <TooltipContent>
                  {t('list.table.archivedAt', {
                    date: formatDisplayDate(row.archivedAt)
                  })}
                </TooltipContent>
              </Tooltip>
              <span aria-hidden="true">·</span>
            </>
          )}
          <span className="truncate">
            {row.isProductCompany
              ? t('list.table.productCompany')
              : t('list.table.agencyStudio')}
          </span>
        </div>
      </div>
    </div>
  );
}
