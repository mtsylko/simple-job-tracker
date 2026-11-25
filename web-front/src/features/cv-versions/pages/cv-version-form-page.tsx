import { SyntheticEvent, useMemo, useRef, useState } from 'react';
import type { TFunction } from 'i18next';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { ROUTES } from '@/app/routes';
import { FormActionsFooter } from '@/components/FormActionsFooter';
import { UnsavedChangesDialog } from '@/components/UnsavedChangesDialog';
import { Button } from '@/components/ui/button.tsx';
import { CheckboxField } from '@/components/ui/checkbox-field';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet
} from '@/components/ui/field';
import { FileUploadField } from '@/components/ui/file-upload-field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { uploadCvVersionAttachment } from '@/features/cv-versions/cv-version-api';
import { isParsableUrl } from '@/features/utils';
import { useUnsavedChangesGuard } from '@/hooks/use-unsaved-changes-guard';
import { trackCvAttachmentUploaded } from '@/lib/analytics-events';
import { dirtyKeys } from '@/lib/dirty-fields';
import { useFileUploadLabels } from '@/lib/ui-labels';
import type {
  CvVersionFormValues,
  CvVersionRow
} from '@/features/cv-versions/types';
import { emptyCvVersionFormValues } from '@/features/cv-versions/types';

function buildCvVersionFormSchema(t: TFunction<'cvVersions'>) {
  return z
    .object({
      name: z.string().trim().min(1, t('form.validation.nameRequired')),
      description: z.string().trim(),
      attachment: z.string().trim(),
      sourceLink: z
        .string()
        .trim()
        .refine((value) => value.length === 0 || isParsableUrl(value), {
          message: t('form.validation.sourceLinkInvalid')
        }),
      enabled: z.boolean()
    })
    .strict();
}

type CvVersionFormErrors = Partial<Record<keyof CvVersionFormValues, string>>;

/** A local upload finishes in ~10ms, too fast to paint — hold the bar long enough to read. */
const MIN_UPLOAD_VISIBLE_MS = 600;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/** Fields that render their own error message underneath the input. */
const INLINE_ERROR_FIELDS = new Set<keyof CvVersionFormValues>([
  'name',
  'sourceLink',
  'attachment',
  'description'
]);

/** Maps Zod issues onto form fields, keeping the first message per field. */
function collectFieldErrors(error: {
  issues: readonly { path: PropertyKey[]; message: string }[];
}): CvVersionFormErrors {
  const errors: CvVersionFormErrors = {};

  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field === 'string' && !(field in errors)) {
      errors[field as keyof CvVersionFormValues] = issue.message;
    }
  }

  return errors;
}

function toFormValues(cvVersion: CvVersionRow): CvVersionFormValues {
  return {
    name: cvVersion.name,
    description: cvVersion.description,
    attachment: cvVersion.attachment,
    sourceLink: cvVersion.sourceLink,
    enabled: cvVersion.enabled
  };
}

export function CvVersionFormPage({
  mode,
  cvVersion,
  onSubmit,
  onSaved,
  onCancel
}: {
  mode: 'create' | 'edit';
  cvVersion?: CvVersionRow;
  onSubmit: (values: CvVersionFormValues) => Promise<void>;
  /** After a save: the navigation here is the one the unsaved-changes guard lets through. */
  onSaved: () => void;
  onCancel?: () => void;
}) {
  const navigate = useNavigate();
  const { t } = useTranslation('cvVersions');
  const fileUploadLabels = useFileUploadLabels();
  // The snapshot the form is compared with for unsaved changes
  const [initialValues] = useState<CvVersionFormValues>(() =>
    cvVersion ? toFormValues(cvVersion) : emptyCvVersionFormValues
  );
  const [values, setValues] = useState<CvVersionFormValues>(initialValues);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // State lags a render behind, so Enter pressed twice in one tick needs a ref
  const submitLock = useRef(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<CvVersionFormErrors>({});
  // `values.attachment` holds the stored server path; the field shows a readable label
  const [attachmentLabel, setAttachmentLabel] = useState(
    cvVersion?.attachment ?? ''
  );
  const [uploadPercent, setUploadPercent] = useState<number | null>(null);
  const formId = 'cv-version-form';

  const dirtyFieldLabels = useMemo(
    () =>
      dirtyKeys(values, initialValues).map((key) =>
        t(key === 'enabled' ? 'form.fields.enabledTitle' : `form.fields.${key}`)
      ),
    [values, initialValues, t]
  );
  const isDirty = dirtyFieldLabels.length > 0;
  const guard = useUnsavedChangesGuard(isDirty);

  function handleChange<K extends keyof CvVersionFormValues>(
    name: K,
    value: CvVersionFormValues[K]
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

  async function uploadAttachment(file: File) {
    const previousLabel = attachmentLabel;
    const previousAttachment = values.attachment;
    const startedAt = Date.now();

    setAttachmentLabel(file.name);
    handleChange('attachment', '');
    setUploadPercent(0);

    try {
      const uploaded = await uploadCvVersionAttachment(file, setUploadPercent);
      handleChange('attachment', uploaded);
      trackCvAttachmentUploaded();
      setUploadPercent(100);
      await delay(
        Math.max(0, MIN_UPLOAD_VISIBLE_MS - (Date.now() - startedAt))
      );
    } catch (error) {
      // Keep whatever was attached before, and let the field render the message
      setAttachmentLabel(previousLabel);
      handleChange('attachment', previousAttachment);
      throw error;
    } finally {
      setUploadPercent(null);
    }
  }

  async function handleSubmit() {
    if (submitLock.current) return;

    if (uploadPercent !== null) {
      setSubmitError(t('form.validation.attachmentUploading'));
      return;
    }

    const validation = buildCvVersionFormSchema(t).safeParse(values);
    if (!validation.success) {
      const errors = collectFieldErrors(validation.error);
      setFieldErrors(errors);
      // Fall back to a form-level message only for fields with no inline slot,
      // so a validation failure can never end up invisible
      const unrenderedMessage = Object.entries(errors).find(
        ([field]) =>
          !INLINE_ERROR_FIELDS.has(field as keyof CvVersionFormValues)
      )?.[1];
      setSubmitError(unrenderedMessage ?? null);
      return;
    }

    setFieldErrors({});
    setSubmitError(null);
    submitLock.current = true;
    setIsSubmitting(true);

    try {
      await onSubmit({
        ...validation.data,
        name: validation.data.name.trim(),
        description: validation.data.description.trim(),
        attachment: validation.data.attachment.trim(),
        sourceLink: validation.data.sourceLink.trim()
      });
      guard.release();
      onSaved();
    } catch (error) {
      setSubmitError(
        error instanceof Error && error.message.trim().length > 0
          ? error.message
          : t('form.validation.failedToSave')
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

  return (
    <main className="mx-auto w-full max-w-[960px] px-4 py-7 pb-16 sm:px-7">
      {/* Page head */}
      <div className="mb-6 flex items-start justify-between gap-6">
        <div>
          <Button
            type="button"
            variant="link"
            onClick={() => navigate(ROUTES.cvVersions)}
            className="text-sm mb-2 px-0 text-muted-foreground hover:no-underline"
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            {t('form.backToCvVersions')}
          </Button>
          <h1 className="m-0 font-serif text-display font-light leading-display tracking-tight text-foreground">
            {mode === 'create'
              ? t('form.newCvVersionTitle')
              : values.name || t('form.editCvVersionTitle')}
          </h1>
        </div>
      </div>

      {/* Form card */}
      <div className="rounded-2xl border border-border bg-card p-7.5">
        <form id={formId} onSubmit={handleFormSubmit}>
          {/* One disabled fieldset locks every control while the save is in flight */}
          <fieldset disabled={isSubmitting} className="min-w-0">
            <FieldSet>
              <FieldLegend>{t('form.sections.details')}</FieldLegend>
              <FieldGroup className="grid gap-4 md:grid-cols-2 md:items-start">
                <Field className="gap-1.5">
                  <FieldLabel htmlFor="cv-version-name">
                    {t('form.fields.name')}{' '}
                    <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input
                    id="cv-version-name"
                    value={values.name}
                    onChange={(event) =>
                      handleChange('name', event.currentTarget.value)
                    }
                  />
                  <FieldError>{fieldErrors.name}</FieldError>
                </Field>

                <Field className="gap-1.5">
                  <FieldLabel htmlFor="cv-version-source-link">
                    {t('form.fields.sourceLink')}
                  </FieldLabel>
                  <Input
                    id="cv-version-source-link"
                    value={values.sourceLink}
                    onChange={(event) =>
                      handleChange('sourceLink', event.currentTarget.value)
                    }
                    placeholder={t('form.placeholders.sourceLink')}
                  />
                  <FieldError>{fieldErrors.sourceLink}</FieldError>
                </Field>

                <Field className="gap-1.5">
                  <FieldLabel htmlFor="cv-version-attachment-file">
                    {t('form.fields.attachment')}
                  </FieldLabel>
                  <FileUploadField
                    id="cv-version-attachment-file"
                    value={attachmentLabel}
                    onValueChange={(nextValue) => {
                      setAttachmentLabel(nextValue);
                      if (nextValue.length === 0) {
                        handleChange('attachment', '');
                      }
                    }}
                    onFileSelect={uploadAttachment}
                    accept="application/pdf,.pdf"
                    acceptedFormatsLabel="PDF"
                    maxSizeMb={10}
                    disabled={isSubmitting}
                    uploadPercent={uploadPercent}
                    progressLabel={t('form.attachmentUpload.label')}
                    uploadLabel={t('fileUpload.upload', { ns: 'common' })}
                    labels={fileUploadLabels}
                  />
                  <FieldError>{fieldErrors.attachment}</FieldError>
                </Field>

                <Field className="gap-1.5">
                  <FieldLabel htmlFor="cv-version-description">
                    {t('form.fields.description')}
                  </FieldLabel>
                  <Textarea
                    id="cv-version-description"
                    className="md:min-h-32"
                    value={values.description}
                    onChange={(event) =>
                      handleChange('description', event.currentTarget.value)
                    }
                    rows={4}
                  />
                  <FieldError>{fieldErrors.description}</FieldError>
                </Field>
              </FieldGroup>
            </FieldSet>

            <div className="my-6 border-t border-border" />

            <FieldSet>
              <FieldLegend>{t('form.sections.visibility')}</FieldLegend>
              <FieldGroup>
                <Field className="gap-1.5">
                  <CheckboxField
                    id="cv-version-enabled"
                    className="h-9 gap-2.5"
                    checkboxClassName="size-4.5"
                    label={t('form.fields.enabledTitle')}
                    checked={values.enabled}
                    onCheckedChange={(checked) =>
                      handleChange('enabled', checked)
                    }
                  />
                  <FieldDescription>
                    {t('form.fields.enabledDescription')}
                  </FieldDescription>
                </Field>
              </FieldGroup>
            </FieldSet>
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
