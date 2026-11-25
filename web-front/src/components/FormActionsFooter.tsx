import { useMemo } from 'react';
import { Check, Pencil } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useAppFooterAction } from '@/app/app-footer-action-hooks';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type FormActionsFooterProps = {
  formId: string;
  isSubmitting: boolean;
  /** When given, the "Unsaved changes" hint shows only while true. */
  isDirty?: boolean;
  submitLabel: string;
  submittingLabel?: string;
  onCancel?: () => void;
  cancelLabel?: string;
  hint?: string;
  className?: string;
};

export function FormActionsFooter({
  formId,
  isSubmitting,
  isDirty,
  submitLabel,
  submittingLabel,
  onCancel,
  cancelLabel,
  hint,
  className
}: FormActionsFooterProps) {
  const { t } = useTranslation('common');
  const resolvedSubmittingLabel = submittingLabel ?? t('form.saving');
  const resolvedCancelLabel = cancelLabel ?? t('form.cancel');
  const resolvedHint =
    hint ?? (isDirty === false ? null : t('form.unsavedChanges'));

  const actionNode = useMemo(
    () => (
      <div
        className={cn(
          'flex w-full items-center justify-between gap-4',
          className
        )}
      >
        {resolvedHint ? (
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Pencil className="size-3" aria-hidden="true" />
            {resolvedHint}
          </span>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-2">
          {onCancel ? (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              {resolvedCancelLabel}
            </Button>
          ) : null}
          <Button type="submit" form={formId} disabled={isSubmitting}>
            <Check className="size-3.5" aria-hidden="true" />
            {isSubmitting ? resolvedSubmittingLabel : submitLabel}
          </Button>
        </div>
      </div>
    ),
    [
      resolvedCancelLabel,
      className,
      formId,
      resolvedHint,
      isSubmitting,
      onCancel,
      submitLabel,
      resolvedSubmittingLabel
    ]
  );

  useAppFooterAction(actionNode);

  return null;
}
