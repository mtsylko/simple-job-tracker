import { useTranslation } from 'react-i18next';
import { Check, Monitor, Moon, Sun } from 'lucide-react';

import {
  DropdownMenuItem,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';

import { THEME_MODES, type ThemeMode } from '@/app/theme';
import { useThemeStore } from '@/app/theme-store';

const THEME_MODE_ICONS: Record<ThemeMode, typeof Sun> = {
  light: Sun,
  dark: Moon,
  system: Monitor
};

/**
 * The three theme choices as menu rows, so they can sit inside a larger menu
 * rather than owning a trigger of their own. The vendored dropdown primitive
 * exports no RadioItem, so the active mode is marked with a trailing check.
 */
export function ThemeMenuItems() {
  const { t } = useTranslation('common');
  const mode = useThemeStore((state) => state.mode);
  const setMode = useThemeStore((state) => state.setMode);

  return (
    <>
      <DropdownMenuLabel className="text-muted-foreground">
        {t('theme.label')}
      </DropdownMenuLabel>
      {THEME_MODES.map((themeMode) => {
        const Icon = THEME_MODE_ICONS[themeMode];

        return (
          <DropdownMenuItem
            key={themeMode}
            onClick={() => setMode(themeMode)}
            className="justify-between"
          >
            <span className="flex items-center gap-2">
              <Icon className="size-4" aria-hidden="true" />
              {t(`theme.${themeMode}`)}
            </span>
            {themeMode === mode && (
              <Check className="size-4" aria-hidden="true" />
            )}
          </DropdownMenuItem>
        );
      })}
    </>
  );
}
