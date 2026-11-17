// Every analytics event the app sends, defined in one place so the payloads
// stay reviewable. Parameters must be low-cardinality and non-identifying:
// no company names, job titles, notes, or user-authored taxonomies (role,
// level, type, status and outcome are all user-authored now), so neither status
// nor outcome carries an analytics payload.
import { trackEvent } from './google-analytics';

// `login` is a GA4 recommended event name, so it lands in the standard reports.
// Fired on intent, before the OAuth redirect — abandoned sign-ins count too.
export function trackLogin(): void {
  trackEvent('login', { method: 'google' });
}

export function trackJobCreated(): void {
  trackEvent('job_created');
}

export function trackJobUpdated(): void {
  trackEvent('job_updated');
}

export function trackJobArchived(archived: boolean): void {
  trackEvent('job_archived', { archived });
}

export function trackJobDeleted(): void {
  trackEvent('job_deleted');
}

export function trackApplicationsExported(count: number): void {
  trackEvent('applications_exported', { count });
}

export function trackCvVersionCreated(): void {
  trackEvent('cv_version_created');
}

export function trackCvVersionDeleted(): void {
  trackEvent('cv_version_deleted');
}

export function trackCvAttachmentUploaded(): void {
  trackEvent('cv_attachment_uploaded');
}
