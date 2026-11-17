import type { TFunction } from 'i18next';
import { z } from 'zod';

import { type JobFormValues, type JobRow } from '@/features/jobs/types';

export type JobFormFieldChangeHandler = <K extends keyof JobFormValues>(
  name: K,
  value: JobFormValues[K]
) => void;

export type JobFormErrors = Partial<Record<keyof JobFormValues, string>>;

/** Maps Zod issues onto form fields, keeping the first message per field. */
export function collectFieldErrors(error: {
  issues: readonly { path: PropertyKey[]; message: string }[];
}): JobFormErrors {
  const errors: JobFormErrors = {};

  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field === 'string' && !(field in errors)) {
      errors[field as keyof JobFormValues] = issue.message;
    }
  }

  return errors;
}

export function buildJobFormSchema(t: TFunction<'jobs'>) {
  return z.object({
    company: z.string().trim().min(1, t('form.validation.companyRequired')),
    isProductCompany: z.boolean(),
    jobPostLink: z
      .string()
      .trim()
      .min(1, t('form.validation.jobPostLinkRequired'))
      .pipe(z.url(t('form.validation.jobPostLinkInvalid'))),
    location: z.string().trim(),
    role: z.string().trim().min(1, t('form.validation.roleRequired')),
    level: z.string().trim().min(1, t('form.validation.levelRequired')),
    salaryRange: z.string().trim(),
    salaryExpectations: z.string().trim(),
    appliedAt: z.string().trim().min(1, t('form.validation.dateRequired')),
    type: z.string().trim().min(1, t('form.validation.typeRequired')),
    employmentType: z.string().trim(),
    contractType: z.string().trim(),
    cv: z.string().trim().min(1, t('form.validation.cvRequired')),
    status: z.string().trim().min(1, t('form.validation.statusRequired')),
    outcome: z.string().trim(),
    notes: z.string().trim(),
    applicationQuestions: z.string().trim()
  });
}

export function toFormValues(job: JobRow): JobFormValues {
  return {
    company: job.company,
    isProductCompany: job.isProductCompany,
    jobPostLink: job.jobPostLink,
    location: job.location,
    role: job.role,
    level: job.level,
    salaryRange: job.salaryRange,
    salaryExpectations: job.salaryExpectations,
    appliedAt: job.appliedAt,
    type: job.type,
    employmentType: job.employmentType,
    contractType: job.contractType,
    cv: job.cv,
    status: job.status,
    outcome: job.outcome,
    notes: job.notes,
    applicationQuestions: job.applicationQuestions,
    customFields: job.customFields
  };
}

export function normalizeUniqueValues(values: string[]): string[] {
  return Array.from(
    new Set(
      values.map((value) => value.trim()).filter((value) => value.length > 0)
    )
  );
}

export function getDirtyFieldLabels(
  t: TFunction<'jobs'>
): Record<keyof JobFormValues, string> {
  return {
    company: t('form.fields.companyName'),
    isProductCompany: t('form.fields.companyType'),
    jobPostLink: t('form.fields.jobPostLink'),
    location: t('form.fields.location'),
    role: t('form.fields.role'),
    level: t('form.fields.level'),
    salaryRange: t('form.fields.postedSalaryRange'),
    salaryExpectations: t('form.fields.mySalaryExpectation'),
    appliedAt: t('form.fields.dateOfApplication'),
    type: t('form.fields.workType'),
    employmentType: t('form.fields.employmentType'),
    contractType: t('form.fields.contractType'),
    cv: t('form.fields.cvUsed'),
    status: t('form.fields.status'),
    outcome: t('form.fields.outcome'),
    notes: t('form.fields.notes'),
    applicationQuestions: t('form.fields.applicationQuestions'),
    customFields: t('form.fields.customFields')
  };
}
