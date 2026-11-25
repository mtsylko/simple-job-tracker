import { SyntheticEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { ROUTES } from '@/app/routes';
import { FormActionsFooter } from '@/components/FormActionsFooter';
import { UnsavedChangesDialog } from '@/components/UnsavedChangesDialog';
import { StatusBadge } from '../job-list-page/TableCells/StatusBadge.tsx';
import { normalizeCompanyName } from '@/features/jobs/components/company-combobox-utils';

import { useExtractFromLink } from '@/features/jobs/use-extract-from-link';
import { useUnsavedChangesGuard } from '@/hooks/use-unsaved-changes-guard';
import { dirtyKeys } from '@/lib/dirty-fields';
import { formatDisplayDate } from '@/lib/format-date';
import { notify } from '@/lib/notifications';
import { cn } from '@/lib/utils';
import {
  emptyJobFormValues,
  type JobFormValues,
  type JobRow
} from '@/features/jobs/types';
import { Button } from '@/components/ui/button';

import { ApplicationDetailsSection } from './application-details-section';
import { AttachmentsSection } from './AttachmentsSection';
import { CompensationSection } from './compensation-section';
import { CustomFieldsSection } from './CustomFieldsSection';
import { useCustomFields } from './use-custom-fields';
import { useFormFieldOrder } from './form-field-order';
import {
  buildJobFormSchema,
  collectFieldErrors,
  getDirtyFieldLabels,
  toFormValues,
  type JobFormErrors
} from './job-form.schema';
import { NotesSection } from './notes-section';
import { RoleDetailsSection } from './role-details-section';
import { StatusSection } from './status-section';
import { useJobAttachments } from './use-job-attachments';
import { useJobStatusOptions } from '@/features/jobs/use-job-status-options';
import { useJobOutcomeOptions } from '@/features/jobs/use-job-outcome-options';

/** Fields that render their own error message underneath the input. */
const INLINE_ERROR_FIELDS = new Set<keyof JobFormValues>([
  'company',
  'jobPostLink',
  'appliedAt',
  'role',
  'level',
  'type',
  'cv'
]);

/** Fields "Fill from link" can fill. */
const EXTRACTED_FIELDS = [
  'company',
  'role',
  'level',
  'type',
  'salaryRange'
] as const;

export function JobFormPage({
  mode,
  job,
  companyOptions = [],
  roleOptions = [],
  levelOptions = [],
  typeOptions = [],
  employmentTypeOptions = [],
  contractTypeOptions = [],
  cvOptions = [],
  onSubmit,
  onSaved,
  onCancel
}: {
  mode: 'create' | 'edit';
  job?: JobRow;
  companyOptions?: string[];
  roleOptions?: string[];
  levelOptions?: string[];
  typeOptions?: string[];
  employmentTypeOptions?: string[];
  contractTypeOptions?: string[];
  cvOptions?: string[];
  /** Saves the application and resolves to its id, so the attachments can follow it. */
  onSubmit: (values: JobFormValues) => Promise<string>;
  onSaved: () => void;
  onCancel?: () => void;
}) {
  const navigate = useNavigate();
  const { t } = useTranslation('jobs');
  const [values, setValues] = useState<JobFormValues>(() =>
    job ? toFormValues(job) : emptyJobFormValues()
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  // State lags a render behind, so Enter pressed twice in one tick needs a ref
  const submitLock = useRef(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<JobFormErrors>({});
  const { statusOptions } = useJobStatusOptions();
  const { outcomeOptions } = useJobOutcomeOptions();
  // Header badge colour: from the currently selected status, falling back to the
  // loaded row's colour before the options arrive.
  const headerStatusColor =
    statusOptions.find((option) => option.value === values.status)?.color ??
    job?.statusColor ??
    '#4a6088';
  // The fields when the posting was asked for and as they are now: one typed into while it was read keeps the typing.
  const valuesAtExtract = useRef(values);
  const currentValues = useRef(values);
  useEffect(() => {
    currentValues.current = values;
  }, [values]);
  const extraction = useExtractFromLink(values.jobPostLink, (result) => {
    for (const field of EXTRACTED_FIELDS) {
      const value = result[field];
      if (
        value &&
        currentValues.current[field] === valuesAtExtract.current[field]
      ) {
        handleChange(field, value);
      }
    }
  });

  const { orders, reorder, isReady: isLayoutReady } = useFormFieldOrder();
  const attachments = useJobAttachments(job?.id);
  const custom = useCustomFields({
    customFields: values.customFields,
    setCustomFields: (updater) =>
      setValues((prev) => ({
        ...prev,
        customFields: updater(prev.customFields)
      })),
    t
  });

  // Dirty state — compare current values against the snapshot taken on mount
  const [initialValues] = useState<JobFormValues>(() =>
    job ? toFormValues(job) : emptyJobFormValues()
  );

  const dirtyFieldLabels = useMemo(() => {
    const labels = getDirtyFieldLabels(t);
    const changed = dirtyKeys(values, initialValues).map((key) => labels[key]);
    return attachments.hasChanges
      ? [...changed, t('form.sections.attachments')]
      : changed;
  }, [values, initialValues, attachments.hasChanges, t]);
  const isDirty = dirtyFieldLabels.length > 0;
  const guard = useUnsavedChangesGuard(isDirty);

  const formId = 'job-form';

  function handleChange<K extends keyof JobFormValues>(
    name: K,
    value: JobFormValues[K]
  ) {
    setValues((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => {
      if (!(name in prev)) {
        return prev;
      }

      const next = { ...prev };
      delete next[name];
      return next;
    });
  }

  async function handleSubmit() {
    if (submitLock.current) return;

    // The status picker shows only in edit mode, so a new application inherits
    // the user's default status here; edit mode already carries the chosen one.
    const defaultStatus =
      statusOptions.find((option) => option.isDefault)?.value ??
      statusOptions[0]?.value ??
      '';
    const candidate: JobFormValues = {
      ...values,
      status: values.status || defaultStatus
    };
    const validation = buildJobFormSchema(t).safeParse(candidate);
    // Custom fields validate separately — they are not part of the fixed schema,
    // so both checks run before submit and their errors surface together.
    const customFieldsValid = custom.validate();

    if (!validation.success) {
      const errors = collectFieldErrors(validation.error);
      setFieldErrors(errors);
      // Fall back to a form-level message only for fields with no inline slot,
      // so a validation failure can never end up invisible
      const unrenderedMessage = Object.entries(errors).find(
        ([field]) => !INLINE_ERROR_FIELDS.has(field as keyof JobFormValues)
      )?.[1];
      setSubmitError(unrenderedMessage ?? null);
      return;
    }

    // Custom-field errors render inline under each field, so no form-level message.
    if (!customFieldsValid) {
      setFieldErrors({});
      setSubmitError(null);
      return;
    }

    setFieldErrors({});
    setSubmitError(null);
    submitLock.current = true;
    setIsSubmitting(true);

    try {
      const data = validation.data;
      const savedJobId = await onSubmit({
        ...data,
        company: normalizeCompanyName(data.company),
        salaryRange: data.salaryRange.trim(),
        salaryExpectations: data.salaryExpectations.trim(),
        status: data.status as JobFormValues['status'],
        outcome: (data.outcome.trim() || '') as JobFormValues['outcome'],
        notes: data.notes.trim(),
        applicationQuestions: data.applicationQuestions.trim(),
        customFields: values.customFields
      });
      const failures = await attachments.commit(savedJobId);
      if (failures.length > 0) {
        notify.error(
          t('form.attachments.saveFailed', {
            names: failures.map((failure) => failure.fileName).join(', ')
          }),
          failures[0]?.message
        );
      }
      // The saved values still differ from the mount snapshot, so the guard is told to let this one through
      guard.release();
      onSaved();
    } catch (error) {
      setSubmitError(
        error instanceof Error && error.message.trim().length > 0
          ? error.message
          : t('form.validation.failedToSaveJob')
      );
    } finally {
      submitLock.current = false;
      setIsSubmitting(false);
    }
  }

  function handleFormSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    void handleSubmit();
  }

  const backTo = ROUTES.applications;

  return (
    <main className="mx-auto w-full max-w-[960px] px-4 py-7 pb-16 sm:px-7">
      {/* Page head */}
      <div className="mb-6 flex items-start justify-between gap-6">
        <div>
          <Button
            type="button"
            variant="link"
            onClick={() => navigate(backTo)}
            className="text-sm mb-2 px-0 text-muted-foreground hover:no-underline"
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            {t('form.backToApplications')}
          </Button>
          <h1 className="m-0 font-serif text-display font-light leading-display tracking-tight text-foreground">
            {mode === 'create'
              ? t('form.newApplicationTitle')
              : values.company || t('form.editApplicationTitle')}
          </h1>
          {mode === 'edit' && values.status && (
            <div className="mt-2 flex items-center gap-3 text-sm text-muted-foreground">
              {values.role && <span>{values.role}</span>}
              {values.appliedAt && (
                <span>
                  {t('form.appliedPrefix', {
                    date: formatDisplayDate(values.appliedAt)
                  })}
                </span>
              )}
              {values.status && (
                <>
                  <span>·</span>
                  <StatusBadge
                    status={values.status}
                    color={headerStatusColor}
                  />
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Form card */}
      <div className="rounded-2xl border border-border bg-card p-7.5">
        {/* The stored field order decides where every field sits, so the fields stay
            invisible until it arrives — painting the declaration order first makes them
            visibly reshuffle. `invisible` rather than `hidden`: visibility:hidden keeps
            the form's real height, so the card cannot collapse and snap back open when
            the order lands. Both take it out of the tab order and hide it from screen
            readers alike. The order is cached per session, so this is at most a brief
            blank on the first form open. */}
        <form
          id={formId}
          onSubmit={handleFormSubmit}
          // The vendored select and date triggers are 12px; the text inputs beside them are 14px
          className={cn(
            '[&_[data-slot=popover-trigger]]:text-sm [&_[data-slot=select-trigger]]:text-sm',
            !isLayoutReady && 'invisible'
          )}
        >
          {/* One disabled fieldset locks every control while the save is in flight */}
          <fieldset disabled={isSubmitting} className="min-w-0">
            <ApplicationDetailsSection
              values={values}
              errors={fieldErrors}
              companyOptions={companyOptions}
              onFieldChange={handleChange}
              onExtractFromLink={() => {
                valuesAtExtract.current = values;
                void extraction.extract();
              }}
              canExtractFromLink={extraction.canExtract}
              isExtracting={extraction.isExtracting}
              extractError={extraction.extractError}
              order={orders.applicationDetails}
              onOrderChange={(next) => reorder('applicationDetails', next)}
              t={t}
            />

            <div className="my-6 border-t border-border" />

            <RoleDetailsSection
              values={values}
              errors={fieldErrors}
              roleOptions={roleOptions}
              levelOptions={levelOptions}
              typeOptions={typeOptions}
              employmentTypeOptions={employmentTypeOptions}
              contractTypeOptions={contractTypeOptions}
              cvOptions={cvOptions}
              onFieldChange={handleChange}
              order={orders.roleDetails}
              onOrderChange={(next) => reorder('roleDetails', next)}
              t={t}
            />

            <div className="my-6 border-t border-border" />

            {mode === 'edit' && (
              <>
                {/* Status — edit mode only; new applications default to "applied" */}
                <StatusSection
                  values={values}
                  statusOptions={statusOptions}
                  outcomeOptions={outcomeOptions}
                  onFieldChange={handleChange}
                  order={orders.status}
                  onOrderChange={(next) => reorder('status', next)}
                  t={t}
                />

                <div className="my-6 border-t border-border" />
              </>
            )}

            <CompensationSection
              values={values}
              onFieldChange={handleChange}
              order={orders.compensation}
              onOrderChange={(next) => reorder('compensation', next)}
              t={t}
            />

            <div className="my-6 border-t border-border" />

            <NotesSection
              values={values}
              onFieldChange={handleChange}
              order={orders.notes}
              onOrderChange={(next) => reorder('notes', next)}
              t={t}
            />

            {custom.definitions.length > 0 && (
              <>
                <div className="my-6 border-t border-border" />

                <CustomFieldsSection
                  definitions={custom.definitions}
                  values={values.customFields}
                  errors={custom.errors}
                  onFieldChange={custom.handleChange}
                  t={t}
                />
              </>
            )}

            <div className="my-6 border-t border-border" />

            <AttachmentsSection
              jobId={job?.id}
              attachments={attachments}
              disabled={isSubmitting}
              t={t}
            />
          </fieldset>

          {submitError && (
            <p className="mt-4 text-xs text-destructive">{submitError}</p>
          )}
        </form>
      </div>

      <FormActionsFooter
        formId={formId}
        isSubmitting={isSubmitting}
        isDirty={isDirty}
        submitLabel={
          mode === 'create' ? t('form.submit') : t('form.saveChanges')
        }
        onCancel={onCancel}
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
