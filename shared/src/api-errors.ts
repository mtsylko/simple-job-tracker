/**
 * Stable codes for the API errors the web app shows. The API keeps an English
 * `message` beside each code for logs and for clients that read it as-is (the
 * extension); the web app shows its own copy for the code in the UI language.
 */
export const API_ERROR_CODES = [
  'VALIDATION_FAILED',
  'LIST_ORDER_MISMATCH',
  'INSUFFICIENT_PERMISSIONS',

  'JOB_NOT_FOUND',
  'JOB_ATTACHMENT_NOT_FOUND',
  'JOB_ATTACHMENT_REQUIRED',
  'JOB_ATTACHMENT_UNSUPPORTED',
  'JOB_ATTACHMENT_LIMIT_REACHED',

  'CV_VERSION_NOT_FOUND',
  'CV_ATTACHMENT_NOT_FOUND',
  'CV_ATTACHMENT_REQUIRED',
  'CV_ATTACHMENT_NOT_PDF',
  'CV_ATTACHMENT_INVALID',
  'CV_ATTACHMENT_MISSING',
  'CV_ATTACHMENT_IN_USE',

  'TAXONOMY_OPTION_NOT_FOUND',
  'TAXONOMY_VALUE_TAKEN',
  'JOB_STATUS_TAKEN',
  'JOB_STATUS_UNKNOWN',
  'JOB_STATUS_NONE_CONFIGURED',
  'PRESET_UNKNOWN',

  'JOB_FIELD_NOT_FOUND',
  'JOB_FIELD_NAME_TAKEN',
  'JOB_FIELD_OPTIONS_REQUIRED',
  'JOB_FIELD_OPTIONS_IN_USE',

  'COMPANY_NOT_FOUND',
  'COMPANY_ALREADY_BLACKLISTED',
  'COMPANY_HAS_APPLICATIONS',
  'COMPANY_NAME_TAKEN',

  'ANSWER_NOT_FOUND',
  'ANSWER_TITLE_TAKEN',
  'ANSWER_LIMIT_REACHED',
  'QUESTION_NOT_FOUND',

  'FEEDBACK_NOT_FOUND',
  'FEEDBACK_DAILY_LIMIT_REACHED',

  'TRANSLATION_OVERRIDE_NOT_FOUND',

  'MAIL_NOT_CONFIGURED',
  'MAIL_ADDRESS_NOT_ISSUED',
  'MAIL_MESSAGE_NOT_FOUND',
  'MAIL_MESSAGE_RESOLVED',
  'MAIL_NO_SENDER',
  'MAIL_UPDATE_EMPTY',

  'AI_NOT_CONFIGURED',
  'AI_KEY_REJECTED',
  'AI_UNAVAILABLE',
  'AI_DAILY_LIMIT_REACHED',
  'LOCATION_SUGGEST_UNAVAILABLE',

  'USER_NOT_FOUND',
  'ADMIN_ACCOUNT_NOT_VIEWABLE',
  'VIEW_AS_ADMIN_ONLY',
  'VIEW_AS_READ_ONLY',
  'VIEW_AS_NOT_OPEN'
] as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[number];

/** Values the translated copy interpolates, e.g. a limit or the blocking options. */
export type ApiErrorParams = Record<string, string | number>;

/** The body of a coded error; `ZodValidationPipe` sends `error` in place of `message`. */
export type ApiErrorBody = {
  message: string;
  code: ApiErrorCode;
  params?: ApiErrorParams;
};

export function isApiErrorCode(value: unknown): value is ApiErrorCode {
  return (
    typeof value === 'string' &&
    (API_ERROR_CODES as readonly string[]).includes(value)
  );
}
