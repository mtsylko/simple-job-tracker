import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export function BlacklistAddForm({
  onSubmit,
  onCancel
}: {
  onSubmit: (company: string, reason: string | null) => Promise<void>;
  onCancel: () => void;
}) {
  const { t } = useTranslation('companies');
  const [company, setCompany] = useState('');
  const [reason, setReason] = useState('');
  const [companyError, setCompanyError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async () => {
    const trimmed = company.trim();
    if (!trimmed) {
      setCompanyError(t('validation.companyRequired'));
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);
    try {
      await onSubmit(trimmed, reason.trim() || null);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : t('form.add'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-5">
      <Field className="gap-1.5">
        <FieldLabel htmlFor="blacklist-company">
          {t('form.companyLabel')}
        </FieldLabel>
        <Input
          id="blacklist-company"
          autoFocus
          value={company}
          placeholder={t('form.companyPlaceholder')}
          disabled={isSubmitting}
          onChange={(event) => {
            setCompany(event.target.value);
            if (companyError) setCompanyError(null);
          }}
        />
        <FieldError>{companyError}</FieldError>
      </Field>

      <Field className="gap-1.5">
        <FieldLabel htmlFor="blacklist-reason">
          {t('form.reasonLabel')}
        </FieldLabel>
        <Textarea
          id="blacklist-reason"
          rows={2}
          value={reason}
          placeholder={t('form.reasonPlaceholder')}
          disabled={isSubmitting}
          onChange={(event) => setReason(event.target.value)}
        />
      </Field>

      {submitError && <p className="text-xs text-destructive">{submitError}</p>}

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          {t('form.cancel')}
        </Button>
        <Button
          type="button"
          onClick={() => void submit()}
          disabled={isSubmitting || company.trim().length === 0}
        >
          {t('form.save')}
        </Button>
      </div>
    </div>
  );
}
