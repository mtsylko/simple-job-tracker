// Google Analytics 4 via react-ga4: inert without VITE_GA_MEASUREMENT_ID, and nothing loads until the visitor opts in.
import ReactGA from 'react-ga4';

const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;

export const isAnalyticsEnabled = Boolean(measurementId);

// Consent Mode v2 defaults; only analytics_storage is ever granted.
const DENIED_BY_DEFAULT = {
  analytics_storage: 'denied',
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied'
} as const;

let hasConsent = false;

// gtag's own opt-out flag, read on every hit, since a loaded script cannot be unloaded.
function setOptOut(id: string, optedOut: boolean): void {
  (window as unknown as Record<string, boolean>)[`ga-disable-${id}`] = optedOut;
}

// `_ga` lands on the widest domain gtag can write, so every parent domain is tried.
function removeAnalyticsCookies(): void {
  const names = document.cookie
    .split(';')
    .map((cookie) => cookie.split('=')[0].trim())
    .filter((name) => name.startsWith('_ga'));
  const labels = window.location.hostname.split('.');
  const domains = labels.map((_, index) => labels.slice(index).join('.'));

  for (const name of names) {
    document.cookie = `${name}=; Max-Age=0; path=/`;
    for (const domain of domains) {
      document.cookie = `${name}=; Max-Age=0; path=/; domain=${domain}`;
    }
  }
}

export function enableGoogleAnalytics(): void {
  if (!measurementId || hasConsent) return;

  hasConsent = true;
  setOptOut(measurementId, false);

  if (ReactGA.isInitialized) {
    ReactGA.gtag('consent', 'update', { analytics_storage: 'granted' });
    return;
  }

  // Both consent commands have to reach the dataLayer ahead of `config`.
  ReactGA.gtag('consent', 'default', DENIED_BY_DEFAULT);
  ReactGA.gtag('consent', 'update', { analytics_storage: 'granted' });
  ReactGA.initialize(measurementId, {
    // Page views are sent by hand on every route change; without this the
    // initial load would be counted twice and navigations not at all. It has to
    // be `gtagOptions` — `gaOptions` runs a UA-name translation that drops it.
    gtagOptions: { send_page_view: false }
  });
}

// Also runs on every load without consent, clearing `_ga` cookies set before the banner existed.
export function disableGoogleAnalytics(): void {
  if (!measurementId) return;

  hasConsent = false;

  if (ReactGA.isInitialized) {
    ReactGA.gtag('consent', 'update', { analytics_storage: 'denied' });
    setOptOut(measurementId, true);
  }

  removeAnalyticsCookies();
}

// `path` is expected to be a route pattern (`/jobs/edit/:id`), never a resolved
// URL — record IDs and filter query strings must not reach Google.
export function trackPageView(path: string): void {
  // Uninitialized calls still reach window.dataLayer, so the guard stays.
  if (!hasConsent) return;

  ReactGA.send({
    hitType: 'pageview',
    page: path,
    location: `${window.location.origin}${path}`,
    title: document.title
  });
}

export function trackEvent(
  name: string,
  params?: Record<string, string | number | boolean>
): void {
  if (!hasConsent) return;

  ReactGA.event(name, params);
}
