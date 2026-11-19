import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { ROUTES } from '@/app/routes';
import { useCvVersionsLoadState } from '@/features/cv-versions/use-cv-versions-load-state';
import { useJobsStore } from '@/features/jobs/job-store';
import { JobFormPage } from '@/features/jobs/pages/job-form-page';
import { type JobFormValues } from '@/features/jobs/types';
import { useJobTaxonomyOptions } from '@/features/jobs/use-job-taxonomy-options';
import { useJobsLoadState } from '@/features/jobs/use-jobs-load-state';
import { notifyActionSuccess } from '@/lib/notifications';

export function CreateJobRoute() {
  const navigate = useNavigate();
  // Carries the list filters the user came in with back to the list.
  const { search: listSearch } = useLocation();
  const { jobs } = useJobsLoadState();
  const { cvVersions } = useCvVersionsLoadState();
  const taxonomyOptions = useJobTaxonomyOptions();
  const createJob = useJobsStore((state) => state.createJob);
  const companyOptions = useMemo(
    () =>
      Array.from(
        new Set(
          jobs
            .map((job) => job.company.trim())
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

  async function handleSubmit(values: JobFormValues): Promise<string> {
    const created = await createJob(values);
    return created.id;
  }

  function handleSaved() {
    notifyActionSuccess('created', 'job');
    navigate({ pathname: ROUTES.jobs, search: listSearch });
  }

  function handleCancel() {
    navigate({ pathname: ROUTES.jobs, search: listSearch });
  }

  return (
    <JobFormPage
      key="job-create"
      mode="create"
      companyOptions={companyOptions}
      {...taxonomyOptions}
      cvOptions={cvOptions}
      onSubmit={handleSubmit}
      onSaved={handleSaved}
      onCancel={handleCancel}
    />
  );
}
