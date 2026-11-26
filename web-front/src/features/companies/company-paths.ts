import type { CompanySummary } from '@job-tracker/shared';

import { ROUTES } from '@/app/routes';

/** The applications list filtered to one company, archived applications included. */
export function companyApplicationsPath(company: string): string {
  const search = new URLSearchParams({ company, scope: 'all' });
  return `${ROUTES.applications}?${search.toString()}`;
}

/** Where a company page returns to: the list it was opened from, tab included. */
export type CompanyPageState = {
  back: string;
  /** A new company opened from the Blacklisted tab starts ticked to avoid. */
  avoid?: boolean;
};

export function startsAvoided(state: unknown): boolean {
  return (state as Partial<CompanyPageState> | null)?.avoid === true;
}

/** Added by hand and never applied to, so nothing else goes when it is deleted. */
export function canDelete(
  company: CompanySummary
): company is CompanySummary & { id: string } {
  return company.id !== null && company.applicationCount === 0;
}

export function companiesBackPath(state: unknown): string {
  const back = (state as Partial<CompanyPageState> | null)?.back;
  return typeof back === 'string' && back.startsWith(ROUTES.companies)
    ? back
    : ROUTES.companies;
}
