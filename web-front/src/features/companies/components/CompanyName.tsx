import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { CompanySummary } from '@job-tracker/shared';

import {
  companyApplicationsPath,
  hasApplications
} from '@/features/companies/company-paths';
import { ROW_OPENER, ROW_OPENER_CLASS } from '@/lib/row-open';
import { cn } from '@/lib/utils';

/** Name over a fixed-height subline, so rows match on both tabs with or without the marker. */
export function CompanyName({
  company,
  children
}: {
  company: CompanySummary;
  children: ReactNode;
}) {
  return (
    <>
      {hasApplications(company) ? (
        <Link
          to={companyApplicationsPath(company.name)}
          {...ROW_OPENER}
          className={cn(
            'block truncate text-sm font-medium text-foreground',
            ROW_OPENER_CLASS
          )}
        >
          {company.name}
        </Link>
      ) : (
        <span className="block truncate text-sm font-medium text-foreground">
          {company.name}
        </span>
      )}
      <div className="flex h-4.5 min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
        {children}
      </div>
    </>
  );
}
