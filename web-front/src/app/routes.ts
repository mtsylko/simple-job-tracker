export const ROUTES = {
  home: '/',
  signIn: '/sign-in',
  privacy: '/privacy',
  terms: '/terms',
  applications: '/applications',
  analytics: '/analytics',
  cvVersions: '/cv-versions',
  cvVersionsCreate: '/cv-versions/create',
  cvVersionsEdit: '/cv-versions/edit/:id',
  jobs: '/jobs',
  jobsCreate: '/jobs/create',
  jobsEdit: '/jobs/edit/:id',
  taxonomies: '/taxonomies',
  taxonomiesList: '/taxonomies/:list',
  jobFields: '/custom-fields',
  companies: '/companies',
  companyCreate: '/companies/create',
  company: '/companies/:name',
  adminUsers: '/admin/users',
  adminFeedback: '/admin/feedback',
  adminTranslations: '/admin/translations',
  profile: '/profile',
  fallback: '*'
} as const;

export function jobEditPath(id: string): string {
  return `/jobs/edit/${encodeURIComponent(id)}`;
}

export function taxonomiesListPath(list: string): string {
  return `/taxonomies/${encodeURIComponent(list)}`;
}

/** A company's own page; companies have no id until something is stored for them. */
export function companyPath(name: string): string {
  return `/companies/${encodeURIComponent(name)}`;
}

export function cvVersionEditPath(id: string): string {
  return `/cv-versions/edit/${encodeURIComponent(id)}`;
}
