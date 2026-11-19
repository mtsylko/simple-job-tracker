import { Navigate, Route, Routes } from 'react-router-dom';

import {
  CreateJobRoute,
  EditJobRoute,
  ListJobsRoute
} from '@/features/jobs/routes/job-routes';
import {
  CreateCvVersionRoute,
  EditCvVersionRoute,
  ListCvVersionsRoute
} from '@/features/cv-versions/routes/cv-versions-routes';
import { AnalyticsRoute } from '@/features/analytics/routes/analytics-route';
import { TaxonomiesRoute } from '@/features/taxonomies/routes/taxonomy-routes';
import { JobFieldsRoute } from '@/features/job-fields/routes/job-fields-route';
import { CompaniesRoute } from '@/features/companies/routes/companies-route';
import { AdminUsersRoute } from '@/features/admin-users/routes/admin-users-route';
import { AdminFeedbackRoute } from '@/features/admin-feedback/routes/admin-feedback-route';
import { AdminTranslationsRoute } from '@/features/admin-translations/routes/admin-translations-route';
import { ProfileRoute } from '@/features/profile/routes/profile-route';

import { HomeRedirect } from '@/features/auth/HomeRedirect';
import { RequireAuth } from '@/features/auth/RequireAuth';
import { RequireRole } from '@/features/auth/RequireRole';
import { SignInPage } from '@/features/auth/SignInPage';
import { LegalPage } from '@/features/legal/pages/LegalPage';

import { AppLayout } from './AppLayout';
import { ROUTES, taxonomiesListPath } from './routes';
import { useDocumentTitle } from './use-document-title';
import { useGoogleAnalytics } from './use-google-analytics';

export function AppRoutes() {
  // Before the page view, which reports document.title.
  useDocumentTitle();
  // Sits here rather than in App, which is outside the router that useLocation needs.
  useGoogleAnalytics();

  return (
    <Routes>
      <Route path={ROUTES.signIn} element={<SignInPage />} />
      <Route path={ROUTES.privacy} element={<LegalPage document="privacy" />} />
      <Route path={ROUTES.terms} element={<LegalPage document="terms" />} />
      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route path={ROUTES.home} element={<HomeRedirect />} />
          <Route path={ROUTES.applications} element={<ListJobsRoute />} />
          <Route
            path="/interviews"
            element={<Navigate to={ROUTES.applications} replace />}
          />
          <Route path={ROUTES.analytics} element={<AnalyticsRoute />} />
          <Route path={ROUTES.cvVersions} element={<ListCvVersionsRoute />} />
          <Route
            path={ROUTES.cvVersionsCreate}
            element={<CreateCvVersionRoute />}
          />
          <Route
            path={ROUTES.cvVersionsEdit}
            element={<EditCvVersionRoute />}
          />
          <Route path={ROUTES.jobs} element={<ListJobsRoute />} />
          <Route path={ROUTES.jobsCreate} element={<CreateJobRoute />} />
          <Route path={ROUTES.jobsEdit} element={<EditJobRoute />} />
          <Route
            path={ROUTES.taxonomies}
            element={<Navigate to={taxonomiesListPath('roles')} replace />}
          />
          <Route path={ROUTES.taxonomiesList} element={<TaxonomiesRoute />} />
          <Route path={ROUTES.jobFields} element={<JobFieldsRoute />} />
          <Route path={ROUTES.companies} element={<CompaniesRoute />} />
          <Route
            path="/blacklist"
            element={
              <Navigate to={`${ROUTES.companies}?tab=blacklisted`} replace />
            }
          />
          <Route element={<RequireRole role="admin" />}>
            <Route path={ROUTES.adminUsers} element={<AdminUsersRoute />} />
            <Route
              path={ROUTES.adminFeedback}
              element={<AdminFeedbackRoute />}
            />
            <Route
              path={ROUTES.adminTranslations}
              element={<AdminTranslationsRoute />}
            />
          </Route>
          <Route path={ROUTES.profile} element={<ProfileRoute />} />
          <Route
            path={ROUTES.fallback}
            element={<Navigate to={ROUTES.applications} replace />}
          />
        </Route>
      </Route>
    </Routes>
  );
}
