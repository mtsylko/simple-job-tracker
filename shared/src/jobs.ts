export type JobRole = string;
export type JobLevel = string;
export type JobType = string;
// Employment type (work-time) and contract type (legal form) are per-user
// taxonomies like role/level/type — the value is an option label referenced by
// its FK on the job. Kept as string aliases so imports stay simple.
export type JobEmploymentType = string;
export type JobContractType = string;
export type JobCv = string;
// Status is now a per-user taxonomy: the value is a status option label,
// referenced (like role/level/type) by its FK on the job. Lifecycle metadata
// lives on `JobStatusOption` (see job-taxonomy). Kept as an alias so existing
// imports keep compiling.
export type JobStatus = string;
// Outcome is now a per-user taxonomy too: the value is an outcome option label,
// referenced by its FK on the job (like role/level/type). Kept as a string alias
// so existing imports keep compiling.
export type JobOutcome = string;

import type { JobCustomFields } from './job-fields';

export type CreateJobInput = {
  company: string;
  isProductCompany: boolean;
  jobPostLink: string;
  location?: string | null;
  role: JobRole;
  level: JobLevel;
  salaryRange?: string | null;
  salaryExpectations?: string | null;
  appliedAt: string;
  type: JobType;
  employmentType?: JobEmploymentType | null;
  contractType?: JobContractType | null;
  cv: JobCv;
  status?: JobStatus;
  outcome?: JobOutcome | null;
  notes?: string | null;
  applicationQuestions?: string | null;
  /** Values for user-defined fields, keyed by `JobFieldDefinition.key`. */
  customFields?: JobCustomFields;
};

export type UpdateJobInput = Partial<CreateJobInput>;
