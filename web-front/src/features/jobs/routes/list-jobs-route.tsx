import { useRef } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { jobEditPath } from '@/app/routes';
import { useJobsStore } from '@/features/jobs/job-store';
import { JobListPage } from '@/features/jobs/pages/job-list-page';
import { getPersistedListSearch } from '@/features/jobs/pages/job-list-page/use-job-list-url-filters';
import { useJobsLoadState } from '@/features/jobs/use-jobs-load-state';

export function ListJobsRoute() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation('jobs');
  const { jobs, isLoading, error, refreshJobs } = useJobsLoadState();
  const deleteJob = useJobsStore((state) => state.deleteJob);
  const setJobArchived = useJobsStore((state) => state.setJobArchived);

  // Restore stored filters/sort on a bare URL before the list paints, so they
  // never flash in from a second render. A one-shot at mount: once redirected
  // the URL carries the query, and this must not re-fire and undo a cleared URL.
  const restoreChecked = useRef<true | null>(null);
  if (restoreChecked.current == null) {
    restoreChecked.current = true;
    const restore = getPersistedListSearch();
    if (restore) {
      return <Navigate to={{ search: restore }} replace />;
    }
  }

  /**
   * The filter query string travels with the form, so saving or cancelling can
   * return to the list exactly as it was left.
   */
  function handleEdit(id: string) {
    navigate({ pathname: jobEditPath(id), search: location.search });
  }

  if (isLoading) {
    return (
      <main className="mx-auto w-full max-w-4xl py-8 md:py-10">
        <section className="rounded-lg border bg-card p-4">
          <h1 className="m-0 text-2xl font-medium text-foreground">
            {t('route.loadingTitle')}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t('route.loadingSubtitle')}
          </p>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto w-full max-w-4xl py-8 md:py-10">
        <section className="rounded-lg border bg-card p-4">
          <h1 className="m-0 text-2xl font-medium text-foreground">
            {t('route.loadErrorTitle')}
          </h1>
          <p className="mt-2 text-sm text-destructive">{error}</p>
          <div className="mt-4">
            <Button variant="outline" onClick={() => void refreshJobs()}>
              {t('route.retry')}
            </Button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <JobListPage
      jobs={jobs}
      onEdit={handleEdit}
      onSetArchived={setJobArchived}
      onDelete={deleteJob}
    />
  );
}
