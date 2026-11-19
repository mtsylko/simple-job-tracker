import { isApiErrorCode } from '@job-tracker/shared';

import i18n from '@/i18n';
import { redirectIfSignedOut } from '@/lib/session-expiry';
import { viewAsHeaders } from '@/lib/view-as';

/** Carries the HTTP status so callers can react to specific failures, e.g. 429. */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Our copy for a known `code`, which may quote the server's own text as `{{detail}}`; otherwise that text. */
export function parseApiErrorBody(body: string, fallback: string): string {
  try {
    const data = JSON.parse(body) as {
      message?: unknown;
      error?: unknown;
      code?: unknown;
      params?: unknown;
    };
    const detail = [data.message, data.error].find(
      (candidate): candidate is string =>
        typeof candidate === 'string' && candidate.trim().length > 0
    );

    if (isApiErrorCode(data.code)) {
      const params =
        typeof data.params === 'object' && data.params !== null
          ? data.params
          : {};
      return i18n.t(data.code, { detail, ...params, ns: 'apiErrors' });
    }

    if (detail) {
      return detail;
    }
  } catch {
    // fall back to status text
  }

  return fallback;
}

/** Shared by the fetch and XHR paths, which read the status text differently. */
export function apiErrorFallback(statusText: string): string {
  return statusText || i18n.t('api.requestFailed');
}

export async function readApiError(response: Response): Promise<string> {
  // Passport answers 401 with no code, so its English text would reach the toast.
  if (response.status === 401) {
    return i18n.t('api.sessionExpired');
  }
  const fallback = apiErrorFallback(response.statusText);

  try {
    return parseApiErrorBody(await response.text(), fallback);
  } catch {
    return fallback;
  }
}

export async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...viewAsHeaders(url),
      ...init?.headers
    }
  });

  if (!response.ok) {
    redirectIfSignedOut(response.status);
    throw new ApiError(await readApiError(response), response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
