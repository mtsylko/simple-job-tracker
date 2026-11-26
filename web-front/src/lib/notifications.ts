import { toast } from 'sonner';

import i18n from '@/i18n';

/** Mutating actions that get a confirmation notification. */
export type NotificationAction =
  | 'created'
  | 'updated'
  | 'deleted'
  | 'archived'
  | 'restored';

/** Entity keys resolved from `common:notifications.entities.*`. */
export type NotificationEntity =
  | 'job'
  | 'cvVersion'
  | 'jobRole'
  | 'jobLevel'
  | 'jobType'
  | 'jobEmploymentType'
  | 'jobContractType'
  | 'jobStatus'
  | 'jobOutcome'
  | 'jobField'
  | 'company'
  | 'candidateProfile';

function entityLabel(entity: NotificationEntity): string {
  return i18n.t(`notifications.entities.${entity}`, { ns: 'common' });
}

/** Longer than a plain confirmation, so the Undo can be reached. */
const UNDOABLE_DURATION_MS = 8000;

type SuccessOptions = {
  description?: string;
  /** Adds an Undo button that runs this. */
  undo?: () => void;
};

function successToastOptions({ description, undo }: SuccessOptions = {}) {
  if (!undo) return { description };
  return {
    description,
    duration: UNDOABLE_DURATION_MS,
    action: {
      label: i18n.t('notifications.undo', { ns: 'common' }),
      onClick: undo
    }
  };
}

/**
 * Confirms a successful mutation, e.g. `notifyActionSuccess('deleted', 'job')`
 * renders "Application deleted".
 */
export function notifyActionSuccess(
  action: NotificationAction,
  entity: NotificationEntity,
  options?: SuccessOptions
): void {
  toast.success(
    i18n.t(`notifications.success.${action}`, {
      ns: 'common',
      entity: entityLabel(entity)
    }),
    successToastOptions(options)
  );
}

/**
 * Reports a failed mutation. Prefers the API error message and falls back to a
 * generic per-action message so the user is never shown an empty toast.
 */
export function notifyActionError(
  action: NotificationAction,
  entity: NotificationEntity,
  error?: unknown
): void {
  const detail =
    error instanceof Error && error.message.trim().length > 0
      ? error.message.trim()
      : null;

  toast.error(
    i18n.t(`notifications.error.${action}`, {
      ns: 'common',
      entity: entityLabel(entity)
    }),
    detail ? { description: detail } : undefined
  );
}

/** Escape hatch for messages the caller has already translated. */
export const notify = {
  success: (message: string, options?: SuccessOptions) =>
    toast.success(message, successToastOptions(options)),
  error: (message: string, description?: string) =>
    toast.error(message, { description }),
  info: (message: string, description?: string) =>
    toast.info(message, { description }),
  warning: (message: string, description?: string) =>
    toast.warning(message, { description })
};
