import type {
  BlacklistCompanyInput,
  Company,
  CompanySummary
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
