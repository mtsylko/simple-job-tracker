import { create } from 'zustand';

import {
  applyTheme,
  readStoredMode,
  resolveTheme,
  storeMode,
  watchSystemTheme,
  type ResolvedTheme,
  type ThemeMode
} from '@/app/theme';

type ThemeState = {
  mode: ThemeMode;
  resolved: ResolvedTheme;
  setMode: (mode: ThemeMode) => void;
};

const initialMode = readStoredMode();

export const useThemeStore = create<ThemeState>((set) => ({
  mode: initialMode,
  resolved: resolveTheme(initialMode),
  setMode(mode) {
    const resolved = resolveTheme(mode);

    storeMode(mode);
    applyTheme(resolved);
    set({ mode, resolved });
  }
}));

/**
 * Kept outside the store so it is registered once per page load rather than per
 * subscriber. Only 'system' follows the OS; an explicit choice must not be
 * overridden when the user flips their OS appearance.
 */
watchSystemTheme((systemTheme) => {
  if (useThemeStore.getState().mode !== 'system') {
    return;
  }

  applyTheme(systemTheme);
  useThemeStore.setState({ resolved: systemTheme });
});
