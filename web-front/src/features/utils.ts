import i18n from '@/i18n';

export function readErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return i18n.t('errors.unexpected', { ns: 'common' });
}

export function trimToNullable(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Whether the browser can parse `value` as a URL at all. Deliberately not a
 * scheme check — `mailto:` and `ftp:` parse fine — so callers that need a web
 * address should say so themselves.
 */
export function isParsableUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}
