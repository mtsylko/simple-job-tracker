import {
  type CreateJobFieldInput,
  type CreateJobInput,
  type CreateJobStatusOptionInput,
  type JobCustomFields,
  type JobFieldDefinition,
  type JobStatusColor,
  type JobStatusOption,
  type JobTaxonomyOption,
  type UpdateJobFieldInput,
  type UpdateJobInput,
  type UpdateJobStatusOptionInput
} from '@job-tracker/shared';
import i18n from '@/i18n';
import { request } from '@/lib/api-client';
import { resolveAccentHex } from '@/features/jobs/status-badge-colors';
import { type JobFormValues, type JobRow } from '@/features/jobs/types';

type ApiJob = {
  _id: unknown;
  company?: unknown;
  isProductCompany?: unknown;
  jobPostLink?: unknown;
  location?: unknown;
  role?: unknown;
  level?: unknown;
  salaryRange?: unknown;
  salaryExpectations?: unknown;
  appliedAt?: unknown;
  type?: unknown;
  employmentType?: unknown;
  contractType?: unknown;
  cv?: unknown;
  status?: unknown;
  statusColor?: unknown;
  outcome?: unknown;
  notes?: unknown;
  applicationQuestions?: unknown;
  customFields?: unknown;
  archivedAt?: unknown;
  statusChangedAt?: unknown;
};

const JOBS_ENDPOINT = '/api/jobs';

/** Keeps the stored jsonb object as-is; anything else collapses to an empty map. */
function normalizeCustomFields(value: unknown): JobCustomFields {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as JobCustomFields)
    : {};
}

function readObjectId(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }

  if (value && typeof value === 'object' && '$oid' in value) {
    const oid = (value as { $oid?: unknown }).$oid;
    if (typeof oid === 'string') {
      return oid;
    }
  }

  return '';
}

function normalizeDate(value: unknown): string {
  if (typeof value !== 'string' || value.length === 0) {
    return '';
  }

  return value.slice(0, 10);
}

/**
 * Role, level, type and CV are free-form per-user values, so an absent one is
 * reported as empty rather than being defaulted to a guess.
 */
function normalizeTaxonomyValue(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

// Status is a per-user taxonomy value now, so any label the API returns is valid
// and shown verbatim (like role/level/type).
function normalizeStatus(value: unknown): JobRow['status'] {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeStatusColor(value: unknown): JobStatusColor {
  return typeof value === 'string' ? resolveAccentHex(value) : '#4a6088';
}

// Outcome is a per-user taxonomy label now, so any non-empty string is valid;
// an absent outcome comes back as the empty-string sentinel.
function normalizeOutcome(value: unknown): JobRow['outcome'] {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeStringOptions(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .map((item) => (typeof item === 'string' ? item.trim() : ''))
        .filter((item) => item.length > 0)
    )
  );
}

function mapApiJob(job: ApiJob): JobRow {
  const id = readObjectId(job._id);
  if (!id) {
    throw new Error(i18n.t('api.invalidJobId', { ns: 'jobs' }));
  }

  return {
    id,
    company: typeof job.company === 'string' ? job.company : '',
    isProductCompany: Boolean(job.isProductCompany),
    jobPostLink: typeof job.jobPostLink === 'string' ? job.jobPostLink : '',
    location: typeof job.location === 'string' ? job.location : '',
    role: normalizeTaxonomyValue(job.role),
    level: normalizeTaxonomyValue(job.level),
    salaryRange: typeof job.salaryRange === 'string' ? job.salaryRange : '',
    salaryExpectations:
      typeof job.salaryExpectations === 'string' ? job.salaryExpectations : '',
    appliedAt: normalizeDate(job.appliedAt),
    type: normalizeTaxonomyValue(job.type),
    employmentType: normalizeTaxonomyValue(job.employmentType),
    contractType: normalizeTaxonomyValue(job.contractType),
    cv: normalizeTaxonomyValue(job.cv),
    status: normalizeStatus(job.status),
    statusColor: normalizeStatusColor(job.statusColor),
    outcome: normalizeOutcome(job.outcome),
    notes: typeof job.notes === 'string' ? job.notes : '',
    applicationQuestions:
      typeof job.applicationQuestions === 'string'
        ? job.applicationQuestions
        : '',
    customFields: normalizeCustomFields(job.customFields),
    archivedAt: normalizeDate(job.archivedAt),
    statusChangedAt: normalizeDate(job.statusChangedAt)
  };
}

export async function listJobs(): Promise<JobRow[]> {
  const payload = await request<ApiJob[]>(JOBS_ENDPOINT);
  return payload.map(mapApiJob);
}

export async function createJobRoleOption(value: string): Promise<void> {
  await request<{ value: string }>('/api/job-roles', {
    method: 'POST',
    body: JSON.stringify({ value })
  });
}

export async function createJobLevelOption(value: string): Promise<void> {
  await request<{ value: string }>('/api/job-levels', {
    method: 'POST',
    body: JSON.stringify({ value })
  });
}

export async function createJobTypeOption(value: string): Promise<void> {
  await request<{ value: string }>('/api/job-types', {
    method: 'POST',
    body: JSON.stringify({ value })
  });
}

export async function createJobEmploymentTypeOption(
  value: string
): Promise<void> {
  await request<{ value: string }>('/api/job-employment-types', {
    method: 'POST',
    body: JSON.stringify({ value })
  });
}

export async function createJobContractTypeOption(
  value: string
): Promise<void> {
  await request<{ value: string }>('/api/job-contract-types', {
    method: 'POST',
    body: JSON.stringify({ value })
  });
}

export async function createJobOutcomeOption(value: string): Promise<void> {
  await request<{ value: string }>('/api/job-outcomes', {
    method: 'POST',
    body: JSON.stringify({ value })
  });
}

export type TaxonomyOptionClient = {
  list: () => Promise<JobTaxonomyOption[]>;
  update: (id: string, value: string) => Promise<JobTaxonomyOption>;
  remove: (id: string) => Promise<void>;
  setDefault: (id: string) => Promise<void>;
  reorder: (orderedIds: string[]) => Promise<void>;
};

function createTaxonomyOptionClient(basePath: string): TaxonomyOptionClient {
  return {
    list: () => request<JobTaxonomyOption[]>(`${basePath}/options`),
    update: (id, value) =>
      request<JobTaxonomyOption>(`${basePath}/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ value })
      }),
    remove: (id) =>
      request<void>(`${basePath}/${encodeURIComponent(id)}`, {
        method: 'DELETE'
      }),
    setDefault: (id) =>
      request<void>(`${basePath}/${encodeURIComponent(id)}/default`, {
        method: 'PATCH'
      }),
    reorder: (orderedIds) =>
      request<void>(`${basePath}/reorder`, {
        method: 'PATCH',
        body: JSON.stringify({ orderedIds })
      })
  };
}

export const jobRoleTaxonomy = createTaxonomyOptionClient('/api/job-roles');
export const jobLevelTaxonomy = createTaxonomyOptionClient('/api/job-levels');
export const jobTypeTaxonomy = createTaxonomyOptionClient('/api/job-types');
export const jobEmploymentTypeTaxonomy = createTaxonomyOptionClient(
  '/api/job-employment-types'
);
export const jobContractTypeTaxonomy = createTaxonomyOptionClient(
  '/api/job-contract-types'
);
export const jobOutcomeTaxonomy =
  createTaxonomyOptionClient('/api/job-outcomes');

const JOB_STATUSES_ENDPOINT = '/api/job-statuses';

/** Status carries color/kind/tab metadata, so its client is richer than the
 *  value-only taxonomy client above. */
export const jobStatusTaxonomy = {
  list: () => request<JobStatusOption[]>(`${JOB_STATUSES_ENDPOINT}/options`),
  create: (input: CreateJobStatusOptionInput) =>
    request<JobStatusOption>(JOB_STATUSES_ENDPOINT, {
      method: 'POST',
      body: JSON.stringify(input)
    }),
  update: (id: string, input: UpdateJobStatusOptionInput) =>
    request<JobStatusOption>(
      `${JOB_STATUSES_ENDPOINT}/${encodeURIComponent(id)}`,
      { method: 'PATCH', body: JSON.stringify(input) }
    ),
  remove: (id: string) =>
    request<void>(`${JOB_STATUSES_ENDPOINT}/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    }),
  setDefault: (id: string) =>
    request<void>(
      `${JOB_STATUSES_ENDPOINT}/${encodeURIComponent(id)}/default`,
      { method: 'PATCH' }
    ),
  reorder: (orderedIds: string[]) =>
    request<void>(`${JOB_STATUSES_ENDPOINT}/reorder`, {
      method: 'PATCH',
      body: JSON.stringify({ orderedIds })
    })
};

export function listJobStatusOptions(): Promise<JobStatusOption[]> {
  return jobStatusTaxonomy.list();
}

const JOB_FIELDS_ENDPOINT = '/api/job-fields';

/** User-defined field definitions; the form renders an input per active one. */
export async function listJobFields(): Promise<JobFieldDefinition[]> {
  return request<JobFieldDefinition[]>(JOB_FIELDS_ENDPOINT);
}

export async function createJobField(
  input: CreateJobFieldInput
): Promise<JobFieldDefinition> {
  return request<JobFieldDefinition>(JOB_FIELDS_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify(input)
  });
}

export async function updateJobField(
  id: string,
  input: UpdateJobFieldInput
): Promise<JobFieldDefinition> {
  return request<JobFieldDefinition>(
    `${JOB_FIELDS_ENDPOINT}/${encodeURIComponent(id)}`,
    { method: 'PATCH', body: JSON.stringify(input) }
  );
}

/** Archives the definition; stored values on past applications are kept. */
export async function deleteJobField(id: string): Promise<void> {
  await request<void>(`${JOB_FIELDS_ENDPOINT}/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  });
}

export async function createJob(values: JobFormValues): Promise<JobRow> {
  const requestBody: CreateJobInput = {
    company: values.company,
    isProductCompany: values.isProductCompany,
    jobPostLink: values.jobPostLink,
    location: values.location || null,
    role: values.role as CreateJobInput['role'],
    level: values.level as CreateJobInput['level'],
    salaryRange: values.salaryRange || null,
    salaryExpectations: values.salaryExpectations || null,
    appliedAt: values.appliedAt,
    type: values.type as CreateJobInput['type'],
    employmentType: values.employmentType || null,
    contractType: values.contractType || null,
    cv: values.cv as CreateJobInput['cv'],
    status: values.status || undefined,
    outcome: values.outcome || null,
    notes: values.notes || null,
    applicationQuestions: values.applicationQuestions || null,
    customFields: values.customFields
  };

  const payload = await request<ApiJob>(JOBS_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify(requestBody)
  });

  return mapApiJob(payload);
}

export async function updateJob(
  id: string,
  values: JobFormValues
): Promise<JobRow> {
  const requestBody: UpdateJobInput = {
    company: values.company,
    isProductCompany: values.isProductCompany,
    jobPostLink: values.jobPostLink,
    location: values.location || null,
    role: values.role as UpdateJobInput['role'],
    level: values.level as UpdateJobInput['level'],
    salaryRange: values.salaryRange || null,
    salaryExpectations: values.salaryExpectations || null,
    appliedAt: values.appliedAt,
    type: values.type as UpdateJobInput['type'],
    employmentType: values.employmentType || null,
    contractType: values.contractType || null,
    cv: values.cv as UpdateJobInput['cv'],
    status: values.status || undefined,
    outcome: values.outcome || null,
    notes: values.notes || null,
    applicationQuestions: values.applicationQuestions || null,
    customFields: values.customFields
  };

  const payload = await request<ApiJob>(
    `${JOBS_ENDPOINT}/${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(requestBody)
    }
  );

  return mapApiJob(payload);
}

/**
 * Separate from `updateJob`, which sends the whole record: folding the archive
 * flag into it would let a form save overwrite it.
 */
export async function setJobArchived(
  id: string,
  archived: boolean
): Promise<JobRow> {
  const payload = await request<ApiJob>(
    `${JOBS_ENDPOINT}/${encodeURIComponent(id)}/${archived ? 'archive' : 'unarchive'}`,
    { method: 'POST' }
  );

  return mapApiJob(payload);
}

export async function deleteJob(id: string): Promise<void> {
  await request<void>(`${JOBS_ENDPOINT}/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  });
}

/** "City, Country" suggestions for the location field, from the geocoding proxy. */
export async function suggestLocations(query: string): Promise<string[]> {
  const payload = await request<unknown>(
    `/api/locations/suggest?q=${encodeURIComponent(query)}`
  );
  return normalizeStringOptions(payload);
}
