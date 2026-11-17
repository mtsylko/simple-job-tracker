export const LEGAL_ENTITY = {
  name: 'Maxim Tsylko',
  email: 'privacy@simplejobtracker.com'
} as const;

/** The date both documents take effect, shown as "Last updated". */
export const LEGAL_EFFECTIVE_DATE = '2026-11-16';

export type LegalDocument = 'privacy' | 'terms';
