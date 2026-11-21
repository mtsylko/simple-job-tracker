import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList
} from '@/components/ui/combobox';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';

export function BlacklistAddForm({
  companies,
  onSubmit,
  onCancel
}: {
  /** Names of the not-yet-blacklisted companies from the user's applications. */
  companies: string[];
  onSubmit: (company: string, reason: string | null) => Promise<void>;
  onCancel: () => void;
}) {
  const { t } = useTranslation('companies');
  const [company, setCompany] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [companyError, setCompanyError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async () => {
    if (!company) {
      setCompanyError(t('validation.companyRequired'));
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);
    try {
      await onSubmit(company, reason.trim() || null);
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
        <Combobox
          items={companies}
          value={company}
          disabled={isSubmitting}
          onValueChange={(next) => {
            setCompany(next);
            if (companyError) setCompanyError(null);
          }}
        >
          <ComboboxInput
            id="blacklist-company"
            autoFocus
            className="w-full"
            placeholder={t('form.companyPlaceholder')}
            disabled={isSubmitting}
          />
          <ComboboxContent>
            <ComboboxEmpty>{t('form.noCompanies')}</ComboboxEmpty>
            <ComboboxList>
              {(name: string) => (
                <ComboboxItem key={name} value={name}>
                  {name}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
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
          disabled={isSubmitting || !company}
        >
          {t('form.add')}
        </Button>
      </div>
    </div>
  );
}
