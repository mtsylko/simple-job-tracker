import { format, isValid, parse, parseISO } from 'date-fns';

import { DEFAULT_LANGUAGE } from '@/app/language';
import i18n from '@/i18n';

const STORED_DATE_FORMAT = 'yyyy-MM-dd';
const FALLBACK_DISPLAY_FORMAT = 'dd/MM/yyyy';

/** English keeps the browser's own date format; any other UI language formats as itself. */
function resolveDateLocale(language: string): string | undefined {
  return language === DEFAULT_LANGUAGE ? undefined : language;
}

/**
 * Builds a date-fns pattern that matches how a locale orders and separates a
 * numeric date, by inspecting `Intl` parts once. So en-US resolves to
 * `MM/dd/yyyy`, most of Europe to `dd.MM.yyyy` or `dd/MM/yyyy`, ISO locales to
 * `yyyy-MM-dd`. Falls back to `dd/MM/yyyy` if `Intl` is unavailable.
 */
function deriveLocaleDateFormat(locale: string | undefined): string {
  try {
    const parts = new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).formatToParts(new Date(2026, 0, 2));

    const token: Record<string, string> = {
      day: 'dd',
      month: 'MM',
      year: 'yyyy'
    };
    const pattern = parts
      .map((part) => token[part.type] ?? part.value)
      .join('');
    // A valid pattern must carry all three fields; anything else is unusable.
    return /dd/.test(pattern) && /MM/.test(pattern) && /yyyy/.test(pattern)
      ? pattern
      : FALLBACK_DISPLAY_FORMAT;
  } catch {
    return FALLBACK_DISPLAY_FORMAT;
  }
}

/**
 * The app-wide display format, driven by the UI language and browser locale.
 * Shared by the read-only date renderers and the date pickers so they never
 * drift apart. A live binding: reassigned when the UI language changes.
 */
export let LOCALE_DATE_DISPLAY_FORMAT = deriveLocaleDateFormat(
  resolveDateLocale(i18n.resolvedLanguage ?? i18n.language ?? DEFAULT_LANGUAGE)
);

/** The same format lowercased, for use as a date input placeholder/hint. */
export let LOCALE_DATE_PLACEHOLDER = LOCALE_DATE_DISPLAY_FORMAT.toLowerCase();

i18n.on('languageChanged', (language) => {
  LOCALE_DATE_DISPLAY_FORMAT = deriveLocaleDateFormat(
    resolveDateLocale(language)
  );
  LOCALE_DATE_PLACEHOLDER = LOCALE_DATE_DISPLAY_FORMAT.toLowerCase();
});

/**
 * Renders a stored `yyyy-MM-dd` date in the locale display format. Falls back
 * to the raw value when it is empty or does not parse, so unexpected data
 * shows rather than getting blanked out.
 */
export function formatDisplayDate(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }

  const parsed = parse(trimmed, STORED_DATE_FORMAT, new Date());
  return isValid(parsed) ? format(parsed, LOCALE_DATE_DISPLAY_FORMAT) : trimmed;
}

/** Renders an ISO timestamp to the minute in the display format, or the raw value if it does not parse. */
export function formatDisplayDateTime(value: string): string {
  const parsed = parseISO(value);

  return isValid(parsed)
    ? format(parsed, `${LOCALE_DATE_DISPLAY_FORMAT} HH:mm`)
    : value;
}
