import type { TFunction } from 'i18next';
import type { JobCustomFields, JobStatusColor } from '@job-tracker/shared';

export type JobRole = string;
export type JobLevel = string;
export type JobType = string;
export type JobEmploymentType = string;
export type JobContractType = string;
export type JobCv = string;
// Status is now a per-user taxonomy value (see JobStatusOption in shared), shown
// verbatim like role/level/type. The fixed `kind` carries the lifecycle.
export type JobStatus = string;
// Outcome ("why the application ended") is a per-user taxonomy too, managed on
// the Taxonomies page and stored verbatim — no fixed value list here.
export type JobOutcome = string;

/** Which slice of the lifecycle the list shows. */
export const JOB_SCOPE_VALUES = ['active', 'archived', 'all'] as const;

export type JobScope = (typeof JOB_SCOPE_VALUES)[number];

export const DEFAULT_JOB_SCOPE: JobScope = 'active';

export function getJobScopeOptions(
  t: TFunction<'jobs'>
): { value: JobScope; label: string }[] {
  return [
    { value: 'active', label: t('list.filters.scopeActive') },
    { value: 'archived', label: t('list.filters.scopeArchived') },
    { value: 'all', label: t('list.filters.scopeAll') }
  ];
}

export function isArchived(row: JobRow): boolean {
  return row.archivedAt !== '';
}

export type JobRow = {
  id: string;
  company: string;
  isProductCompany: boolean;
  jobPostLink: string;
  location: string;
  role: JobRole;
  level: JobLevel;
  salaryRange: string;
  salaryExpectations: string;
  appliedAt: string;
  type: JobType;
  employmentType: JobEmploymentType;
  contractType: JobContractType;
  cv: JobCv;
  status: JobStatus;
  // Resolved from the status option so the badge needs no lookup.
  statusColor: JobStatusColor;
  outcome: JobOutcome | '';
  notes: string;
  applicationQuestions: string;
  /** Values for user-defined fields, keyed by `JobFieldDefinition.key`. */
  customFields: JobCustomFields;
  /** Empty when the application is active. */
  archivedAt: string;
  /** Date the status last changed (YYYY-MM-DD); distinct from any edit. */
  statusChangedAt: string;
};

export type JobFormValues = {
  company: string;
  isProductCompany: boolean;
  jobPostLink: string;
  location: string;
  role: JobRole | '';
  level: JobLevel | '';
  salaryRange: string;
  salaryExpectations: string;
  appliedAt: string;
  type: JobType | '';
  employmentType: JobEmploymentType | '';
  contractType: JobContractType | '';
  cv: JobCv | '';
  status: JobStatus | '';
  outcome: JobOutcome | '';
  notes: string;
  applicationQuestions: string;
  customFields: JobCustomFields;
};

function getTodayDateValue(): string {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
}

export const emptyJobFormValues: JobFormValues = {
  company: '',
  isProductCompany: false,
  jobPostLink: '',
  location: '',
  role: '',
  level: '',
  salaryRange: '',
  salaryExpectations: '',
  appliedAt: getTodayDateValue(),
  type: '',
  employmentType: '',
  contractType: '',
  cv: '',
  // Filled from the user's default status once the options load.
  status: '',
  outcome: '',
  notes: '',
  applicationQuestions: '',
  customFields: {}
};
