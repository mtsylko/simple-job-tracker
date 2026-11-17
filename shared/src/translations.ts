/** Languages the web app ships copy for; the first is the fallback. */
export const UI_LANGUAGES = ['en', 'pl', 'ru', 'be', 'uk'] as const;

export type UiLanguage = (typeof UI_LANGUAGES)[number];

export const TRANSLATION_VALUE_MAX_LENGTH = 4000;

/** An admin's replacement for one shipped string, found by its namespace and dotted key path. */
export interface TranslationOverride {
  id: string;
  language: UiLanguage;
  namespace: string;
  key: string;
  value: string;
  updatedAt: string;
}

export interface UpsertTranslationOverrideInput {
  language: UiLanguage;
  namespace: string;
  key: string;
  value: string;
}

/** Every override the app applies on load: language → namespace → dotted key → text. */
export type TranslationOverrideBundle = Partial<
  Record<UiLanguage, Record<string, Record<string, string>>>
>;
