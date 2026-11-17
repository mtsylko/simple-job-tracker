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

export function cvVersionEditPath(id: string): string {
  return `/cv-versions/edit/${encodeURIComponent(id)}`;
}
