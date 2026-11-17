import type {
  ApiErrorBody,
  ApiErrorCode,
  ApiErrorParams
} from '@job-tracker/shared';

/** Body for a Nest exception the web app shows: its `code` picks the translated copy. */
export function apiError(
  code: ApiErrorCode,
  message: string,
  params?: ApiErrorParams
): ApiErrorBody {
  return params ? { message, code, params } : { message, code };
}
