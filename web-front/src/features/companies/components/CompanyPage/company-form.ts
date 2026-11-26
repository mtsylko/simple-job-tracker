import type { TFunction } from 'i18next';
import { z } from 'zod';
import type {
  CompanyDetails,
  CreateCompanyInput,
  UpdateCompanyInput
} from '@job-tracker/shared';

import type { CompanyFormValues } from '@/features/companies/types';
import { isParsableUrl } from '@/features/utils';

export type CompanyFormErrors = Partial<
  Record<keyof CompanyFormValues, string>
>;

export type CompanyFieldChange = <K extends keyof CompanyFormValues>(
  name: K,
  value: CompanyFormValues[K]
) => void;

export function toCompanyFormValues(
  details: CompanyDetails
): CompanyFormValues {
  return {
    name: details.name,
    website: details.website ?? '',
    notes: details.notes ?? '',
    isProductCompany: details.isProductCompany ?? true,
    blacklisted: details.blacklist !== null,
    blacklistReason: details.blacklist?.reason ?? ''
  };
}

/** A new company's blank form; opened from the Blacklisted tab it starts ticked to avoid. */
export function emptyCompanyFormValues(avoid: boolean): CompanyFormValues {
  return {
    name: '',
    website: '',
    notes: '',
    isProductCompany: true,
    blacklisted: avoid,
    blacklistReason: ''
  };
}

export function toCreateCompanyInput(
  values: CompanyFormValues
): CreateCompanyInput {
  return {
    name: values.name.trim(),
    website: values.website.trim() || null,
    notes: values.notes.trim() || null,
    blacklisted: values.blacklisted,
    blacklistReason: values.blacklisted
      ? values.blacklistReason.trim() || null
      : null
  };
}

export function buildCompanyFormSchema(t: TFunction<'companies'>) {
  return z.object({
    name: z.string().trim().min(1, t('details.nameRequired')).max(200),
    website: z
      .string()
      .trim()
      .max(500)
      .refine(
        (value) =>
          value.length === 0 ||
          (/^https?:\/\//i.test(value) && isParsableUrl(value)),
        { message: t('details.websiteInvalid') }
      ),
    notes: z.string().max(5000),
    isProductCompany: z.boolean(),
    blacklisted: z.boolean(),
    blacklistReason: z.string().max(500)
  });
}

/**
 * The save request: the name and the type go out only when changed, since both
 * rewrite every application to the company.
 */
export function toUpdateCompanyInput(
  details: CompanyDetails,
  initialValues: CompanyFormValues,
  values: CompanyFormValues
): UpdateCompanyInput {
  const input: UpdateCompanyInput = {
    company: details.name,
    website: values.website.trim() || null,
    notes: values.notes.trim() || null,
    blacklisted: values.blacklisted,
    blacklistReason: values.blacklisted
      ? values.blacklistReason.trim() || null
      : null
  };
  const name = values.name.trim();
  if (name !== initialValues.name) {
    input.name = name;
  }
  if (
    details.applications.length > 0 &&
    values.isProductCompany !== initialValues.isProductCompany
  ) {
    input.isProductCompany = values.isProductCompany;
  }
  return input;
}
