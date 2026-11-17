import { useTranslation } from 'react-i18next';
import {
  be,
  enUS,
  pl,
  ru,
  uk,
  type DayPickerLocale
} from 'react-day-picker/locale';

import { DEFAULT_LANGUAGE, isLanguage, type Language } from '@/app/language';

// DayPicker's locales extend date-fns' ones, so date-fns formatters take them too.
const DATE_LOCALES: Record<Language, DayPickerLocale> = {
  en: enUS,
  pl,
  ru,
  be,
  uk
};

/** Month and weekday names in the UI language, for calendars and date-fns. */
export function useDateLocale(): DayPickerLocale {
  const { i18n } = useTranslation();
  const language = isLanguage(i18n.resolvedLanguage)
    ? i18n.resolvedLanguage
    : DEFAULT_LANGUAGE;

  return DATE_LOCALES[language];
}
