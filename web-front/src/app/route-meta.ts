import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';

import {
  CATEGORY_KIND_BY_SLUG,
  CATEGORY_SLUGS
} from '@/features/taxonomies/categories';

import { ROUTES, taxonomiesListPath } from './routes';

export type RouteMeta = {
  crumbs: string[];
  title: string;
  subtitle?: string;
  headerAction?: {
    label: string;
    to: string;
  };
  primaryAction?: {
    label: string;
    to: string;
  };
};

type RouteMetaRule = {
  matches: (pathname: string) => boolean;
  meta: (t: TFunction<'common'>) => RouteMeta;
};

const routeMetaRules: RouteMetaRule[] = [
  {
    matches: (pathname) => pathname === ROUTES.privacy,
    meta: (t) => ({
      crumbs: [],
      title: t('privacy.title', { ns: 'legal' })
    })
  },
  {
    matches: (pathname) => pathname === ROUTES.terms,
    meta: (t) => ({
      crumbs: [],
      title: t('terms.title', { ns: 'legal' })
    })
  },
  {
    matches: (pathname) => pathname === ROUTES.jobsCreate,
    meta: (t) => ({
      crumbs: [
        t('breadcrumbs.workspace'),
        t('breadcrumbs.applications'),
        t('breadcrumbs.newApplication')
      ],
      title: t('routes.jobsCreate.title'),
      subtitle: t('routes.jobsCreate.subtitle'),
      headerAction: {
        label: t('routes.jobsCreate.backToApplications'),
        to: ROUTES.applications
      }
    })
  },
  {
    matches: (pathname) => pathname.startsWith('/jobs/edit/'),
    meta: (t) => ({
      crumbs: [
        t('breadcrumbs.workspace'),
        t('breadcrumbs.applications'),
        t('breadcrumbs.edit')
      ],
      title: t('routes.jobsEdit.title'),
      subtitle: t('routes.jobsEdit.subtitle'),
      headerAction: {
        label: t('routes.jobsEdit.backToApplications'),
        to: ROUTES.applications
      }
    })
  },
  {
    matches: (pathname) => pathname === ROUTES.cvVersions,
    meta: (t) => ({
      crumbs: [t('breadcrumbs.workspace'), t('breadcrumbs.cvVersions')],
      title: t('routes.cvVersions.title'),
      subtitle: t('routes.cvVersions.subtitle'),
      primaryAction: {
        label: t('routes.cvVersions.addCvVersion'),
        to: ROUTES.cvVersionsCreate
      }
    })
  },
  {
    matches: (pathname) => pathname === ROUTES.cvVersionsCreate,
    meta: (t) => ({
      crumbs: [
        t('breadcrumbs.workspace'),
        t('breadcrumbs.cvVersions'),
        t('breadcrumbs.new')
      ],
      title: t('routes.cvVersionsCreate.title'),
      subtitle: t('routes.cvVersionsCreate.subtitle'),
      headerAction: {
        label: t('routes.cvVersionsCreate.backToCvVersions'),
        to: ROUTES.cvVersions
      }
    })
  },
  {
    matches: (pathname) => pathname.startsWith('/cv-versions/edit/'),
    meta: (t) => ({
      crumbs: [
        t('breadcrumbs.workspace'),
        t('breadcrumbs.cvVersions'),
        t('breadcrumbs.edit')
      ],
      title: t('routes.cvVersionsEdit.title'),
      subtitle: t('routes.cvVersionsEdit.subtitle'),
      headerAction: {
        label: t('routes.cvVersionsEdit.backToCvVersions'),
        to: ROUTES.cvVersions
      }
    })
  },
  // Each list's own name in the tab title; the names are fixed words, never user data.
  ...CATEGORY_SLUGS.map(
    (slug): RouteMetaRule => ({
      matches: (pathname) => pathname === taxonomiesListPath(slug),
      meta: (t) => {
        const title = t(`sections.${CATEGORY_KIND_BY_SLUG[slug]}.title`, {
          ns: 'taxonomies'
        });
        return {
          crumbs: [
            t('breadcrumbs.workspace'),
            t('breadcrumbs.taxonomies'),
            title
          ],
          title,
          subtitle: t('routes.taxonomies.subtitle')
        };
      }
    })
  ),
  {
    matches: (pathname) =>
      pathname === ROUTES.taxonomies || pathname.startsWith('/taxonomies/'),
    meta: (t) => ({
      crumbs: [t('breadcrumbs.workspace'), t('breadcrumbs.taxonomies')],
      title: t('routes.taxonomies.title'),
      subtitle: t('routes.taxonomies.subtitle')
    })
  },
  {
    matches: (pathname) => pathname === ROUTES.jobFields,
    meta: (t) => ({
      crumbs: [t('breadcrumbs.workspace'), t('breadcrumbs.jobFields')],
      title: t('routes.jobFields.title'),
      subtitle: t('routes.jobFields.subtitle')
    })
  },
  {
    matches: (pathname) => pathname === ROUTES.companies,
    meta: (t) => ({
      crumbs: [t('breadcrumbs.workspace'), t('breadcrumbs.companies')],
      title: t('routes.companies.title'),
      subtitle: t('routes.companies.subtitle')
    })
  },
  {
    matches: (pathname) => pathname === ROUTES.analytics,
    meta: (t) => ({
      crumbs: [t('breadcrumbs.workspace'), t('routes.analytics.title')],
      title: t('routes.analytics.title')
    })
  },
  {
    matches: (pathname) => pathname === ROUTES.adminUsers,
    meta: (t) => ({
      crumbs: [t('breadcrumbs.admin'), t('breadcrumbs.users')],
      title: t('routes.adminUsers.title')
    })
  },
  {
    matches: (pathname) => pathname === ROUTES.adminFeedback,
    meta: (t) => ({
      crumbs: [t('breadcrumbs.admin'), t('breadcrumbs.feedback')],
      title: t('routes.adminFeedback.title')
    })
  },
  {
    matches: (pathname) => pathname === ROUTES.adminTranslations,
    meta: (t) => ({
      crumbs: [t('breadcrumbs.admin'), t('breadcrumbs.translations')],
      title: t('routes.adminTranslations.title')
    })
  },
  {
    matches: (pathname) => pathname === ROUTES.profile,
    meta: (t) => ({
      crumbs: [t('breadcrumbs.workspace'), t('breadcrumbs.profile')],
      title: t('routes.profile.title'),
      subtitle: t('routes.profile.subtitle')
    })
  },
  {
    matches: (pathname) =>
      pathname === ROUTES.applications || pathname === ROUTES.jobs,
    meta: (t) => ({
      crumbs: [t('breadcrumbs.workspace'), t('breadcrumbs.applications')],
      title: t('routes.applications.title'),
      subtitle: t('routes.applications.subtitle'),
      primaryAction: {
        label: t('routes.applications.addJob'),
        to: ROUTES.jobsCreate
      }
    })
  }
];

export function useRouteMeta(pathname: string): RouteMeta {
  const { t } = useTranslation('common');

  for (const rule of routeMetaRules) {
    if (rule.matches(pathname)) {
      return rule.meta(t);
    }
  }

  return {
    crumbs: [t('breadcrumbs.workspace')],
    title: t('routes.default.title'),
    subtitle: t('routes.default.subtitle')
  };
}
