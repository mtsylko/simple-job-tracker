import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Modal } from '@/components/Modal';
import { Field, FieldLabel } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';

interface BlacklistDialogProps {
  company: string | null;
  isPending: boolean;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

/**
 * Reason text is kept as local state rather than lifted to JobListPage: state
 * there would re-render the whole page, including the jobs table, on every
 * keystroke.
 */
export function BlacklistDialog({
  company,
  isPending,
  onConfirm,
  onCancel
}: BlacklistDialogProps) {
  const { t } = useTranslation('companies');
  const fieldRef = useRef<HTMLTextAreaElement>(null);
  const [reason, setReason] = useState('');
  // Tracks which company the field currently holds text for. Resetting here
  // (during render, not an effect) is the React-sanctioned way to clear state
  // when a prop identifies a new "session" — a new company opening the dialog.
  const [activeCompany, setActiveCompany] = useState<string | null>(null);

  if (company && company !== activeCompany) {
    setActiveCompany(company);
    setReason('');
  }

  return (
    <Modal
      open={company !== null}
      tone="danger"
      // The last company stays in the title while the dialog animates out.
      title={t('blacklistDialog.title', {
        company: company ?? activeCompany ?? ''
      })}
      description={t('blacklistDialog.body')}
      confirmLabel={t('blacklistDialog.confirm')}
      cancelLabel={t('form.cancel')}
      confirmPending={isPending}
      initialFocus={fieldRef}
      onConfirm={() => onConfirm(reason)}
      onCancel={onCancel}
    >
      <Field className="gap-1.5">
        <FieldLabel htmlFor="blacklist-dialog-reason">
          {t('form.reasonLabel')}
        </FieldLabel>
        <Textarea
          ref={fieldRef}
          id="blacklist-dialog-reason"
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
