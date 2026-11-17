import { useTranslation } from 'react-i18next';
import { Check, Languages } from 'lucide-react';

import {
  DropdownMenuContent,
  DropdownMenuItem
} from '@/components/ui/dropdown-menu';
import {
  DropdownMenuSub,
  DropdownMenuSubTrigger
} from '@/components/ui/dropdown-menu-sub';
import { setLanguage } from '@/i18n';

import { LANGUAGES, isLanguage } from '@/app/language';

/** One "Language ›" row whose submenu lists the languages, the current one checked. */
export function LanguageSubmenu() {
  const { t, i18n } = useTranslation('common');
  const current = i18n.resolvedLanguage;

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <Languages className="size-4" aria-hidden="true" />
        {t('language.label')}{' '}
        {isLanguage(current) && (
          <span className="ml-auto text-muted-foreground">
            {t(`language.${current}`)}
          </span>
        )}
      </DropdownMenuSubTrigger>
      <DropdownMenuContent side="right" align="start" sideOffset={8}>
        {LANGUAGES.map((language) => (
          <DropdownMenuItem
            key={language}
            lang={language}
            onClick={() => setLanguage(language)}
            className="justify-between"
          >
            {t(`language.${language}`)}
            {language === current && (
              <Check className="size-4" aria-hidden="true" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenuSub>
  );
}
