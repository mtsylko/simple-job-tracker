export const COMPANIES_TABS = ['all', 'blacklisted'] as const;

export type CompaniesTab = (typeof COMPANIES_TABS)[number];
