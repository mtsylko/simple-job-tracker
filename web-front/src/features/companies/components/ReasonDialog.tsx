import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { CompanySummary } from '@job-tracker/shared';

import { Modal } from '@/components/Modal';
import { Field, FieldLabel } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';

export function ReasonDialog({
  open,
  company,
  isPending,
  onConfirm,
  onCancel
}: {
  open: boolean;
  company: CompanySummary | null;
  isPending: boolean;
  onConfirm: (reason: string | null) => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation('companies');
  const fieldRef = useRef<HTMLTextAreaElement>(null);
  const [reason, setReason] = useState('');
  const [wasOpen, setWasOpen] = useState(false);

  // Every opening starts from the saved reason, not a draft left by a cancel.
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setReason(company?.blacklist?.reason ?? '');
    }
  }

  return (
    <Modal
      open={open}
      title={t('reasonDialog.title', { company: company?.name ?? '' })}
      description={t('reasonDialog.body')}
      confirmLabel={t('form.save')}
      cancelLabel={t('form.cancel')}
      confirmPending={isPending}
      initialFocus={fieldRef}
      onConfirm={() => onConfirm(reason.trim() || null)}
      onCancel={onCancel}
    >
      <Field className="gap-1.5">
        <FieldLabel htmlFor="company-reason">
          {t('form.reasonLabel')}
        </FieldLabel>
        <Textarea
          ref={fieldRef}
          id="company-reason"
          rows={3}
          value={reason}
          placeholder={t('form.reasonPlaceholder')}
          disabled={isPending}
          onChange={(event) => setReason(event.target.value)}
        />
      </Field>
    </Modal>
  );
}
