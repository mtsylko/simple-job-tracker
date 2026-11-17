import type { CompanySummary } from '@job-tracker/shared';

import { ROUTES } from '@/app/routes';

/** The applications list filtered to one company, archived applications included. */
export function companyApplicationsPath(company: string): string {
  const search = new URLSearchParams({ company, scope: 'all' });
  return `${ROUTES.applications}?${search.toString()}`;
}

/** A company row opens its applications, so one with none has nothing to open. */
export function hasApplications(company: CompanySummary): boolean {
  return company.applicationCount > 0;
}
