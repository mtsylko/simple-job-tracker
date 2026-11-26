import type {
  BlacklistCompanyInput,
  Company,
  CompanyDetails,
  CompanySummary,
  CreateCompanyInput,
  UpdateCompanyInput
} from '@job-tracker/shared';
import { request } from '@/lib/api-client';
import { resolveAccentHex } from '@/features/jobs/status-badge-colors';

const ENDPOINT = '/api/companies';

function blacklistPath(id: string): string {
  return `${ENDPOINT}/${encodeURIComponent(id)}/blacklist`;
}

export async function listCompanies(): Promise<CompanySummary[]> {
  const companies = await request<CompanySummary[]>(ENDPOINT);
  // Same colour resolution as the applications list, so a status badge matches across pages.
  return companies.map((company) => ({
    ...company,
    latestStatus: company.latestStatus && {
      ...company.latestStatus,
      color: resolveAccentHex(company.latestStatus.color)
    }
  }));
}

/** Status colours resolved as on the lists, so a badge matches across pages. */
function withResolvedColors(details: CompanyDetails): CompanyDetails {
  return {
    ...details,
    applications: details.applications.map((application) => ({
      ...application,
      status: application.status && {
        ...application.status,
        color: resolveAccentHex(application.status.color)
      }
    }))
  };
}

export async function getCompanyDetails(name: string): Promise<CompanyDetails> {
  const search = new URLSearchParams({ name });
  return withResolvedColors(
    await request<CompanyDetails>(`${ENDPOINT}/details?${search.toString()}`)
  );
}

export async function updateCompany(
  input: UpdateCompanyInput
): Promise<CompanyDetails> {
  return withResolvedColors(
    await request<CompanyDetails>(`${ENDPOINT}/details`, {
      method: 'PATCH',
      body: JSON.stringify(input)
    })
  );
}

export async function createCompany(
  input: CreateCompanyInput
): Promise<CompanyDetails> {
  return withResolvedColors(
    await request<CompanyDetails>(ENDPOINT, {
      method: 'POST',
      body: JSON.stringify(input)
    })
  );
}

export function deleteCompany(id: string): Promise<void> {
  return request<void>(`${ENDPOINT}/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  });
}

export function blacklistCompany(
  input: BlacklistCompanyInput
): Promise<Company> {
  return request<Company>(`${ENDPOINT}/blacklist`, {
    method: 'POST',
    body: JSON.stringify(input)
  });
}

export function updateBlacklistReason(
  id: string,
  reason: string | null
): Promise<Company> {
  return request<Company>(blacklistPath(id), {
    method: 'PATCH',
    body: JSON.stringify({ reason })
  });
}

export function unblacklistCompany(id: string): Promise<void> {
  return request<void>(blacklistPath(id), { method: 'DELETE' });
}
