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
  const { jobs, isLoading, error, refreshJobs } = useJobsLoadState();
  const { cvVersions } = useCvVersionsLoadState();
  const taxonomyOptions = useJobTaxonomyOptions();
  const updateJob = useJobsStore((state) => state.updateJob);
  const { id: jobId = '' } = useParams();
  const job = jobs.find((item) => item.id === jobId);
  const roleOptions = useMemo(
    () =>
      Array.from(
        new Set([
          ...taxonomyOptions.roleOptions,
          ...jobs
            .map((item) => item.role.trim())
            .filter((role) => role.length > 0)
        ])
      ).sort((first, second) => first.localeCompare(second)),
    [jobs, taxonomyOptions.roleOptions]
  );
  const levelOptions = useMemo(
    () =>
      Array.from(
        new Set([
          ...taxonomyOptions.levelOptions,
          ...jobs
            .map((item) => item.level.trim())
            .filter((level) => level.length > 0)
        ])
      ).sort((first, second) => first.localeCompare(second)),
    [jobs, taxonomyOptions.levelOptions]
  );
  const typeOptions = useMemo(
    () =>
      Array.from(
        new Set([
          ...taxonomyOptions.typeOptions,
          ...jobs
            .map((item) => item.type.trim())
            .filter((type) => type.length > 0)
        ])
      ).sort((first, second) => first.localeCompare(second)),
    [jobs, taxonomyOptions.typeOptions]
  );
  const employmentTypeOptions = useMemo(
    () =>
      Array.from(
        new Set([
          ...taxonomyOptions.employmentTypeOptions,
          ...jobs
            .map((item) => item.employmentType.trim())
            .filter((value) => value.length > 0)
        ])
      ).sort((first, second) => first.localeCompare(second)),
    [jobs, taxonomyOptions.employmentTypeOptions]
  );
  const contractTypeOptions = useMemo(
    () =>
      Array.from(
        new Set([
          ...taxonomyOptions.contractTypeOptions,
          ...jobs
            .map((item) => item.contractType.trim())
            .filter((value) => value.length > 0)
        ])
      ).sort((first, second) => first.localeCompare(second)),
    [jobs, taxonomyOptions.contractTypeOptions]
  );
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

  if (error && !job) {
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
      key={`job-edit-${jobId}-${job?.id ?? 'unloaded'}`}
      mode="edit"
      job={job}
      isLoadingJob={isLoading}
      companyOptions={companyOptions}
      roleOptions={roleOptions}
      levelOptions={levelOptions}
      typeOptions={typeOptions}
      employmentTypeOptions={employmentTypeOptions}
      contractTypeOptions={contractTypeOptions}
      cvOptions={cvOptions}
      onSubmit={handleSubmit}
      onSaved={handleSaved}
      onCancel={handleCancel}
    />
  );
}
