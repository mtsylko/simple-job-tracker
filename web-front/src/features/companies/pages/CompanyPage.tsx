import { SyntheticEvent, useMemo, useRef, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { normalizeCompanyName, type CompanyDetails } from '@job-tracker/shared';

import { FormActionsFooter } from '@/components/FormActionsFooter';
import { UnsavedChangesDialog } from '@/components/UnsavedChangesDialog';
import { Button } from '@/components/ui/button';
import { BlacklistedMarker } from '@/features/companies/components/BlacklistedMarker';
import { CompanyApplications } from '@/features/companies/components/CompanyPage/CompanyApplications';
import { CompanyFields } from '@/features/companies/components/CompanyPage/CompanyFields';
import {
  buildCompanyFormSchema,
  type CompanyFormErrors
} from '@/features/companies/components/CompanyPage/company-form';
import type { CompanyFormValues } from '@/features/companies/types';
import { useUnsavedChangesGuard } from '@/hooks/use-unsaved-changes-guard';
import { ApiError } from '@/lib/api-client';
import { dirtyKeys } from '@/lib/dirty-fields';
import { formatDisplayDate } from '@/lib/format-date';

const FIELD_LABEL_KEYS: Record<keyof CompanyFormValues, string> = {
  name: 'details.fields.name',
  website: 'details.fields.website',
  notes: 'details.fields.notes',
  isProductCompany: 'details.fields.type',
  blacklisted: 'details.fields.blacklisted',
  blacklistReason: 'form.reasonLabel'
};

const META_ITEM_CLASS =
  "relative inline-flex items-center pl-6 before:absolute before:left-2.5 before:content-['·']";

/** A company's form: a new one when `details` is null, else the one it shows. */
export function CompanyPage({
  details,
  initialValues,
  existingNames,
  onSubmit,
  onSaved,
  onBack
}: {
  details: CompanyDetails | null;
  initialValues: CompanyFormValues;
  /** Names already in the list; the company's own name is not counted against it. */
  existingNames: string[];
  onSubmit: (
    values: CompanyFormValues,
    initialValues: CompanyFormValues
  ) => Promise<void>;
  /** After a save: the navigation here is the one the unsaved-changes guard lets through. */
  onSaved: () => void;
  onBack: () => void;
}) {
  const { t } = useTranslation('companies');
  const [values, setValues] = useState<CompanyFormValues>(initialValues);
  const [errors, setErrors] = useState<CompanyFormErrors>({});
  // A taken name the server reported, for a list that was loaded before it was taken
  const [serverTakenName, setServerTakenName] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // State lags a render behind, so Enter pressed twice in one tick needs a ref
  const submitLock = useRef(false);
  const formId = 'company-form';

  const dirtyFieldLabels = useMemo(
    () =>
      dirtyKeys(values, initialValues).map((key) => t(FIELD_LABEL_KEYS[key])),
    [values, initialValues, t]
  );
  const isDirty = dirtyFieldLabels.length > 0;
  const guard = useUnsavedChangesGuard(isDirty);

  // Caught as it is typed, so a taken name never reaches the server
  const typedTakenName = useMemo(() => {
    const key = normalizeCompanyName(values.name);
    if (!key || key === normalizeCompanyName(initialValues.name)) return null;
    return (
      existingNames.find((name) => normalizeCompanyName(name) === key) ?? null
    );
  }, [values.name, initialValues.name, existingNames]);
  const takenName = typedTakenName ?? serverTakenName;
  const fieldErrors: CompanyFormErrors =
    typedTakenName && !errors.name
      ? { ...errors, name: t('apiErrors:COMPANY_NAME_TAKEN') }
      : errors;

  const applications = details?.applications ?? [];
  const latest = applications[0];

  function handleChange<K extends keyof CompanyFormValues>(
    name: K,
    value: CompanyFormValues[K]
  ) {
    setValues((prev) => ({ ...prev, [name]: value }));
    if (name === 'name') setServerTakenName(null);
    setErrors((prev) => {
      if (!(name in prev)) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }

  async function handleSubmit() {
    if (submitLock.current || typedTakenName) return;

    const validation = buildCompanyFormSchema(t).safeParse(values);
    if (!validation.success) {
      const next: CompanyFormErrors = {};
      for (const issue of validation.error.issues) {
        const field = issue.path[0] as keyof CompanyFormValues;
        next[field] ??= issue.message;
      }
      setErrors(next);
      return;
    }

    setErrors({});
    setServerTakenName(null);
    setSubmitError(null);
    submitLock.current = true;
    setIsSubmitting(true);
    try {
      await onSubmit(values, initialValues);
      guard.release();
      onSaved();
    } catch (error) {
      const message =
        error instanceof Error && error.message.trim()
          ? error.message
          : t('details.saveFailed');
      // A taken name belongs under the name field, where it can be fixed
      if (error instanceof ApiError && error.status === 409) {
        setErrors({ name: message });
        setServerTakenName(values.name.trim());
      } else {
        setSubmitError(message);
      }
    } finally {
      submitLock.current = false;
      setIsSubmitting(false);
    }
  }

  function handleFormSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    void handleSubmit();
  }

  return (
    <main className="mx-auto w-full max-w-[960px] px-4 py-7 pb-16 sm:px-7">
      <div className="mb-6">
        <Button
          type="button"
          variant="link"
          onClick={onBack}
          className="mb-2 px-0 text-sm text-muted-foreground hover:no-underline"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          {t('details.back')}
        </Button>
        <h1 className="m-0 font-serif text-display font-light leading-display tracking-tight text-foreground">
          {details ? values.name.trim() || details.name : t('details.newTitle')}
        </h1>
        {details && (
          // Every item draws its dot to its left; the first on each line has it clipped off
          <div className="mt-2.5 overflow-hidden">
            <div className="-ml-6 flex flex-wrap items-center gap-y-1.5 text-sm text-ink-3">
              {details.blacklist && (
                <span className={META_ITEM_CLASS}>
                  <span className="text-xs">
                    <BlacklistedMarker blacklist={details.blacklist} />
                  </span>
                </span>
              )}
              <span className={META_ITEM_CLASS}>
                {t('details.applicationCount', { count: applications.length })}
              </span>
              {latest && (
                <span className={META_ITEM_CLASS}>
                  {t('details.lastApplied', {
                    date: formatDisplayDate(latest.appliedAt.slice(0, 10))
                  })}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card p-7.5">
        <form id={formId} onSubmit={handleFormSubmit} noValidate>
          {/* One disabled fieldset locks every control while the save is in flight */}
          <fieldset disabled={isSubmitting} className="min-w-0">
            <CompanyFields
              values={values}
              errors={fieldErrors}
              takenName={takenName}
              applicationCount={applications.length}
              onChange={handleChange}
            />
          </fieldset>

          {submitError && (
            <p role="alert" className="mt-4 text-xs text-destructive">
              {submitError}
            </p>
          )}
        </form>

        {details && (
          <>
            <div className="my-6 border-t border-border" />
            <CompanyApplications
              company={details.name}
              applications={applications}
            />
          </>
        )}
      </div>

      <FormActionsFooter
        formId={formId}
        isSubmitting={isSubmitting}
        isDirty={isDirty}
        submitLabel={details ? t('details.save') : t('details.create')}
        onCancel={onBack}
      />

      <UnsavedChangesDialog
        open={guard.isBlocked}
        dirtyFieldLabels={dirtyFieldLabels}
        onKeepEditing={guard.keepEditing}
        onDiscard={guard.discard}
      />
    </main>
  );
}
