import { UI_LANGUAGES, type UiLanguage } from '@job-tracker/shared';

// Shared with the API, which accepts translation overrides for these only.
export const LANGUAGES = UI_LANGUAGES;

export type Language = UiLanguage;

export const DEFAULT_LANGUAGE: Language = 'en';

const LANGUAGE_STORAGE_KEY = 'jt-language';

export function isLanguage(
  value: string | null | undefined
): value is Language {
  return value != null && (LANGUAGES as readonly string[]).includes(value);
}

function readStoredLanguage(): Language | null {
  try {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return isLanguage(stored) ? stored : null;
  } catch {
    // Private mode and blocked storage throw; detection takes over.
    return null;
  }
}

export function storeLanguage(language: Language): void {
  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch {
    // The choice simply will not survive a reload.
  }
}

/** First of browser languages whose primary subtag we ship, so `pl-PL` picks `pl`. */
function detectBrowserLanguage(): Language | null {
  const candidates = navigator.languages?.length
    ? navigator.languages
    : [navigator.language];

  for (const candidate of candidates) {
    const primary = candidate?.split('-')[0]?.toLowerCase();
    if (isLanguage(primary)) {
      return primary;
    }
  }

  return null;
}

/** An explicit choice wins over the browser; English when neither matches. */
export function resolveInitialLanguage(): Language {
  return readStoredLanguage() ?? detectBrowserLanguage() ?? DEFAULT_LANGUAGE;
}
