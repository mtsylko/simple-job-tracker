import type { CompanySummary } from '@job-tracker/shared';

export function companyTypeKey(
  company: CompanySummary
): 'list.noApplications' | 'list.productCompany' | 'list.agencyStudio' {
  if (company.isProductCompany === null) {
    return 'list.noApplications';
  }
  return company.isProductCompany ? 'list.productCompany' : 'list.agencyStudio';
}
