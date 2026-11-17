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
  const roleOptions = useMemo(
    () =>
      Array.from(
        new Set([
          ...taxonomyOptions.roleOptions,
          ...jobs
            .map((job) => job.role.trim())
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
            .map((job) => job.level.trim())
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
            .map((job) => job.type.trim())
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
            .map((job) => job.employmentType.trim())
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
            .map((job) => job.contractType.trim())
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
