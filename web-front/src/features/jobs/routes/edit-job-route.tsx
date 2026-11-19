import { useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { ROUTES } from '@/app/routes';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { useCvVersionsLoadState } from '@/features/cv-versions/use-cv-versions-load-state';
import { useJobsStore } from '@/features/jobs/job-store';
import { JobFormPage } from '@/features/jobs/pages/job-form-page';
import { type JobFormValues } from '@/features/jobs/types';
import { useJobTaxonomyOptions } from '@/features/jobs/use-job-taxonomy-options';
import { useJobsLoadState } from '@/features/jobs/use-jobs-load-state';
import { notifyActionSuccess } from '@/lib/notifications';

export function EditJobRoute() {
  const navigate = useNavigate();
  // Carries the list filters the user came in with back to the list.
  const { search: listSearch } = useLocation();
  const { t } = useTranslation('jobs');
  const { jobs, isLoading, isFetching, error, refreshJobs } =
    useJobsLoadState();
  const { cvVersions } = useCvVersionsLoadState();
  const taxonomyOptions = useJobTaxonomyOptions();
  const updateJob = useJobsStore((state) => state.updateJob);
  const { id: jobId = '' } = useParams();
  const job = jobs.find((item) => item.id === jobId);
  const companyOptions = useMemo(
    () =>
      Array.from(
        new Set(
          jobs
            .map((item) => item.company.trim())
            .filter((company) => company.length > 0)
        )
      ).sort((first, second) => first.localeCompare(second)),
    [jobs]
  );
  const cvOptions = useMemo(
    () =>
      cvVersions
        .filter((cv) => cv.enabled)
        .map((cv) => cv.name.trim())
        .filter((name) => name.length > 0),
    [cvVersions]
  );

  // A job missing from a list being refetched may be the one just saved elsewhere.
  if (isLoading || (!job && isFetching)) {
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
      <main className="mx-auto w-full max-w-6xl py-8 md:py-10">
        <section className="w-full max-w-3xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {t('route.loadJobErrorTitle')}
              </CardTitle>
              <CardDescription className="text-destructive">
                {error}
              </CardDescription>
              <div className="pt-2">
                <Button variant="outline" onClick={() => void refreshJobs()}>
                  {t('route.retry')}
                </Button>
              </div>
            </CardHeader>
          </Card>
        </section>
      </main>
    );
  }

  if (!job) {
    return (
      <main className="mx-auto w-full max-w-4xl py-8 md:py-10">
        <section className="rounded-lg border bg-card p-4">
          <h1 className="m-0 text-2xl font-medium text-foreground">
            {t('route.notFoundTitle')}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t('route.notFoundBody')}
          </p>
          <div className="mt-4">
            <Button variant="outline" onClick={handleCancel}>
              {t('form.backToApplications')}
            </Button>
          </div>
        </section>
      </main>
    );
  }

  async function handleSubmit(values: JobFormValues): Promise<string> {
    await updateJob(jobId, values);
    return jobId;
  }

  function handleSaved() {
    notifyActionSuccess('updated', 'job');
    navigate({ pathname: ROUTES.jobs, search: listSearch });
  }

  function handleCancel() {
    navigate({ pathname: ROUTES.jobs, search: listSearch });
  }

  return (
    <JobFormPage
      key={`job-edit-${jobId}`}
      mode="edit"
      job={job}
      companyOptions={companyOptions}
      {...taxonomyOptions}
      cvOptions={cvOptions}
      onSubmit={handleSubmit}
      onSaved={handleSaved}
      onCancel={handleCancel}
    />
  );
}
