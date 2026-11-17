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
  | 'candidateProfile';

function entityLabel(entity: NotificationEntity): string {
  return i18n.t(`notifications.entities.${entity}`, { ns: 'common' });
}

/**
 * Confirms a successful mutation, e.g. `notifyActionSuccess('deleted', 'job')`
 * renders "Application deleted".
 */
export function notifyActionSuccess(
  action: NotificationAction,
  entity: NotificationEntity
): void {
  toast.success(
    i18n.t(`notifications.success.${action}`, {
      ns: 'common',
      entity: entityLabel(entity)
    })
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
  success: (message: string, description?: string) =>
    toast.success(message, { description }),
  error: (message: string, description?: string) =>
    toast.error(message, { description }),
  info: (message: string, description?: string) =>
    toast.info(message, { description }),
  warning: (message: string, description?: string) =>
    toast.warning(message, { description })
};
