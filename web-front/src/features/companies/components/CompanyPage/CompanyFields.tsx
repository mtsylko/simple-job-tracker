import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';

import { CheckboxField } from '@/components/ui/checkbox-field';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { companyPath } from '@/app/routes';
import {
  companiesBackPath,
  type CompanyPageState
} from '@/features/companies/company-paths';
import type { CompanyFormValues } from '@/features/companies/types';

import type { CompanyFieldChange, CompanyFormErrors } from './company-form';

/** Every field of a company: one label per control, no hints under them. */
export function CompanyFields({
  values,
  errors,
  takenName,
  applicationCount,
  onChange
}: {
  values: CompanyFormValues;
  errors: CompanyFormErrors;
  /** Set when the name belongs to another company, which the error then links to. */
  takenName: string | null;
  applicationCount: number;
  onChange: CompanyFieldChange;
}) {
  const { t } = useTranslation('companies');
  const location = useLocation();
  // The other company's page returns to the same list this one would
  const takenState: CompanyPageState = {
    back: companiesBackPath(location.state)
  };

  return (
    <FieldSet>
      <FieldLegend>{t('details.sections.details')}</FieldLegend>
      <FieldGroup className="grid gap-4 md:grid-cols-2 md:items-start">
        <Field className="gap-1.5">
          <FieldLabel htmlFor="company-name">
            {t('details.fields.name')}{' '}
            <span className="text-destructive">*</span>
          </FieldLabel>
          <Input
            id="company-name"
            aria-required="true"
            value={values.name}
            onChange={(event) => onChange('name', event.currentTarget.value)}
          />
          <FieldError>{errors.name}</FieldError>
          {takenName && (
            <Link
              to={companyPath(takenName)}
              state={takenState}
              className="text-xs text-destructive underline underline-offset-2"
            >
              {t('details.openExisting', { name: takenName })}
            </Link>
          )}
        </Field>

        <Field className="gap-1.5">
          <FieldLabel htmlFor="company-website">
            {t('details.fields.website')}
          </FieldLabel>
          <Input
            id="company-website"
            type="url"
            inputMode="url"
            placeholder="https://"
            value={values.website}
            onChange={(event) => onChange('website', event.currentTarget.value)}
          />
          <FieldError>{errors.website}</FieldError>
        </Field>

        <Field className="gap-1.5 md:col-span-2">
          <FieldLabel htmlFor="company-notes">
            {t('details.fields.notes')}
          </FieldLabel>
          <Textarea
            id="company-notes"
            rows={4}
            placeholder={t('details.notesPlaceholder')}
            value={values.notes}
            onChange={(event) => onChange('notes', event.currentTarget.value)}
          />
          <FieldError>{errors.notes}</FieldError>
        </Field>

        {/* The two flags share a row; the type lives on applications, so a company with none has none */}
        {applicationCount > 0 && (
          <CheckboxField
            id="company-is-product"
            className="h-9 gap-2.5"
            checkboxClassName="size-4.5"
            label={t('jobs:form.fields.productCompanyCheckbox')}
            checked={values.isProductCompany}
            onCheckedChange={(checked) => onChange('isProductCompany', checked)}
          />
        )}

        {/* Its reason follows on the last row while it is ticked */}
        <CheckboxField
          id="company-blacklisted"
          className="h-9 gap-2.5"
          checkboxClassName="size-4.5"
          label={t('details.fields.blacklisted')}
          checked={values.blacklisted}
          onCheckedChange={(checked) => onChange('blacklisted', checked)}
        />

        {values.blacklisted && (
          <Field className="gap-1.5 md:col-span-2">
            <FieldLabel htmlFor="company-blacklist-reason">
              {t('form.reasonLabel')}
            </FieldLabel>
            <Textarea
              id="company-blacklist-reason"
              rows={3}
              placeholder={t('form.reasonPlaceholder')}
              value={values.blacklistReason}
              onChange={(event) =>
                onChange('blacklistReason', event.currentTarget.value)
              }
            />
            <FieldError>{errors.blacklistReason}</FieldError>
          </Field>
        )}
      </FieldGroup>
    </FieldSet>
  );
}
