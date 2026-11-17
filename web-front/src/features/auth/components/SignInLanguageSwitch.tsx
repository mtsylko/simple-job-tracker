import { Check, ChevronDown, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { LANGUAGES, isLanguage } from '@/app/language';
import { setLanguage } from '@/i18n';
import { cn } from '@/lib/utils';

/** The signed-out counterpart of the user menu's language submenu. */
export function SignInLanguageSwitch() {
  const { t, i18n } = useTranslation('common');
  const current = isLanguage(i18n.resolvedLanguage)
    ? i18n.resolvedLanguage
    : undefined;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={
          current
            ? `${t('language.label')}: ${t(`language.${current}`)}`
            : t('language.label')
        }
        className="h-8 w-auto gap-1.5 border-transparent px-2.5 text-sm font-medium text-ink-2 dark:bg-transparent"
      >
        <Globe className="size-4 text-ink-3" aria-hidden="true" />
        {current ? t(`language.${current}`) : t('language.label')}
        <ChevronDown
          className="size-3.5 text-ink-3 transition-transform in-data-popup-open:rotate-180"
          aria-hidden="true"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="top"
        align="center"
        sideOffset={8}
        className="w-52 rounded-xl p-1.5"
      >
        <DropdownMenuLabel className="px-3 pt-2 pb-1.5 text-xs font-normal text-ink-3">
          {t('language.label')}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {LANGUAGES.map((language) => {
          const isCurrent = language === current;

          return (
            <DropdownMenuItem
              key={language}
              lang={language}
              onClick={() => setLanguage(language)}
              className={cn(
                'min-h-9 justify-between rounded-lg px-3 text-sm',
                isCurrent && 'bg-clay-soft font-medium text-clay'
              )}
            >
              {t(`language.${language}`)}
              {isCurrent && <Check className="size-4" aria-hidden="true" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
