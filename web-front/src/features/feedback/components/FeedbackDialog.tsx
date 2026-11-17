import { useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FEEDBACK_MESSAGE_MAX_LENGTH,
  type FeedbackKind
} from '@job-tracker/shared';

import { Modal } from '@/components/Modal';
import {
  Field,
  FieldDescription,
  FieldLabel,
  FieldLegend,
  FieldSet
} from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import { sendFeedback } from '@/features/feedback/feedback-api';
import { notify } from '@/lib/notifications';

import { FeedbackKindPicker } from './FeedbackKindPicker';

const DEFAULT_KIND: FeedbackKind = 'bug';

export function FeedbackDialog({
  open,
  email,
  onClose
}: {
  open: boolean;
  email: string;
  onClose: () => void;
}) {
  const { t } = useTranslation('feedback');
  const { pathname } = useLocation();
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const [kind, setKind] = useState<FeedbackKind>(DEFAULT_KIND);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const reset = () => {
    setKind(DEFAULT_KIND);
    setMessage('');
  };

  const send = async () => {
    setIsSending(true);
    try {
      await sendFeedback({ kind, message: message.trim(), pagePath: pathname });
      notify.success(t('dialog.sent'));
      reset();
      onClose();
    } catch (error) {
      notify.error(
        t('dialog.sendFailed'),
        error instanceof Error ? error.message : undefined
      );
    } finally {
      setIsSending(false);
    }
  };

  const cancel = () => {
    reset();
    onClose();
  };

  return (
    <Modal
      open={open}
      title={t('dialog.title')}
      description={t('dialog.description', { email })}
      cancelLabel={t('dialog.cancel')}
      confirmLabel={isSending ? t('dialog.sending') : t('dialog.send')}
      confirmPending={isSending}
      confirmDisabled={message.trim().length === 0}
      initialFocus={messageRef}
      onConfirm={() => void send()}
      onCancel={cancel}
    >
      <div className="flex flex-col gap-5">
        <FieldSet className="gap-0">
          <FieldLegend
            id="feedback-kind-label"
            variant="label"
            className="mb-1.5 leading-none"
          >
            {t('dialog.kindLabel')}
          </FieldLegend>
          <FeedbackKindPicker
            labelId="feedback-kind-label"
            value={kind}
            disabled={isSending}
            onChange={setKind}
          />
        </FieldSet>

        <Field className="gap-1.5">
          <FieldLabel htmlFor="feedback-message">
            {t('dialog.messageLabel')}
          </FieldLabel>
          <Textarea
            ref={messageRef}
            id="feedback-message"
            maxLength={FEEDBACK_MESSAGE_MAX_LENGTH}
            value={message}
            placeholder={t(`dialog.placeholders.${kind}`)}
            disabled={isSending}
            onChange={(event) => setMessage(event.target.value)}
            className="max-h-72 min-h-28 resize-none"
          />
          <FieldDescription>{t('dialog.context')}</FieldDescription>
        </Field>
      </div>
    </Modal>
  );
}
