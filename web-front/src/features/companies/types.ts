export const COMPANIES_TABS = ['all', 'blacklisted'] as const;

export type CompaniesTab = (typeof COMPANIES_TABS)[number];

/** What the company page edits; text stays as typed until it is saved. */
export type CompanyFormValues = {
  name: string;
  website: string;
  notes: string;
  isProductCompany: boolean;
  blacklisted: boolean;
  blacklistReason: string;
};
