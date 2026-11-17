import { useEffect } from 'react';
import { matchPath, useLocation } from 'react-router-dom';

import { useAnalyticsConsentStore } from '@/lib/analytics-consent-store';
import {
  disableGoogleAnalytics,
  enableGoogleAnalytics,
  trackPageView
} from '@/lib/google-analytics';

import { ROUTES } from './routes';

// `/`, `/taxonomies` and the fallback only ever redirect, so counting them would put a page
// nobody sees at the top of the report.
const REDIRECT_ONLY: string[] = [
  ROUTES.home,
  ROUTES.taxonomies,
  ROUTES.fallback
];

const ROUTE_PATTERNS = Object.values(ROUTES).filter(
  (pattern) => !REDIRECT_ONLY.includes(pattern)
);

// Reports `/jobs/edit/:id` rather than the resolved UUID, so record identifiers
// stay out of the analytics property. Unmatched paths redirect to a real route
// a moment later and are left uncounted.
function toRoutePattern(pathname: string): string | undefined {
  return ROUTE_PATTERNS.find((pattern) => matchPath(pattern, pathname));
}

export function useGoogleAnalytics(): void {
  const { pathname } = useLocation();
  const granted = useAnalyticsConsentStore(
    (state) => state.choice === 'granted'
  );

  useEffect(() => {
    if (granted) enableGoogleAnalytics();
    else disableGoogleAnalytics();
  }, [granted]);

  // Re-runs on accept, so the page the visitor accepted on is counted too.
  useEffect(() => {
    const pattern = toRoutePattern(pathname);
    if (granted && pattern) trackPageView(pattern);
  }, [pathname, granted]);
}
