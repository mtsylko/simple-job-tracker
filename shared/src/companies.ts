// Jobs match a company by normalized name, not by FK.
export type CompanyBlacklist = {
  reason: string | null;
  blacklistedAt: string;
};

/** A stored company row. */
export type Company = {
  id: string;
  name: string;
  blacklist: CompanyBlacklist | null;
};

/** One line of the companies list: applications and stored rows merged by name. */
export type CompanySummary = {
  /** Null for a company known only from applications. */
  id: string | null;
  name: string;
  applicationCount: number;
  lastAppliedAt: string | null;
  /** Taken from the most recent application; null when there is none. */
  isProductCompany: boolean | null;
  /** The most recent application's status; null when there is none. */
  latestStatus: CompanyLatestStatus | null;
  /** Distinct roles applied for, most recent first. */
  roles: string[];
  blacklist: CompanyBlacklist | null;
};

export type CompanyLatestStatus = {
  value: string;
  color: string;
};

export type BlacklistCompanyInput = {
  company: string;
  reason?: string | null;
};

export type UpdateCompanyBlacklistInput = {
  reason?: string | null;
};

/**
 * Canonical key for matching a company name across the app: dedup on the server,
 * marking on the client. Both sides must call this so the two agree on a match.
 */
export function normalizeCompanyName(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ').toLowerCase();
}
