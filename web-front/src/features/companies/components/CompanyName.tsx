import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { CompanySummary } from '@job-tracker/shared';

import { companyPath } from '@/app/routes';
import type { CompanyPageState } from '@/features/companies/company-paths';
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
  const location = useLocation();
  const state: CompanyPageState = {
    back: `${location.pathname}${location.search}`
  };

  return (
    <>
      <Link
        to={companyPath(company.name)}
        state={state}
        {...ROW_OPENER}
        className={cn(
          'block truncate text-sm font-medium text-foreground',
          ROW_OPENER_CLASS
        )}
      >
        {company.name}
      </Link>
      <div className="flex h-4.5 min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
        {children}
      </div>
    </>
  );
}
