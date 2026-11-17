export const THEME_MODES = ['light', 'dark', 'system'] as const;

export type ThemeMode = (typeof THEME_MODES)[number];

/** Resolved appearance — what the UI actually renders as. */
export type ResolvedTheme = 'light' | 'dark';

/**
 * Also hardcoded in the no-flash script in `index.html`, which runs before any
 * module is evaluated and therefore cannot import this. Change both together.
 */
export const THEME_STORAGE_KEY = 'jt-theme';

const DARK_QUERY = '(prefers-color-scheme: dark)';

function isThemeMode(value: string | null): value is ThemeMode {
  return value !== null && (THEME_MODES as readonly string[]).includes(value);
}

export function prefersDark(): boolean {
  return window.matchMedia(DARK_QUERY).matches;
}

export function readStoredMode(): ThemeMode {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isThemeMode(stored) ? stored : 'system';
  } catch {
    // Private mode and blocked storage both throw here; fall back rather than
    // taking the whole app down over a preference.
    return 'system';
  }
}

export function storeMode(mode: ThemeMode): void {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch {
    // Preference simply will not survive a reload — not worth surfacing.
  }
}

export function resolveTheme(mode: ThemeMode): ResolvedTheme {
  if (mode === 'system') {
    return prefersDark() ? 'dark' : 'light';
  }

  return mode;
}

/**
 * `color-scheme` is declared on `:root` and `.dark` in `index.css`, so toggling
 * the class is enough — native form controls and scrollbars follow it.
 */
export function applyTheme(theme: ResolvedTheme): void {
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

/** Fires whenever the OS appearance changes. Returns an unsubscribe callback. */
export function watchSystemTheme(
  onChange: (theme: ResolvedTheme) => void
): () => void {
  const query = window.matchMedia(DARK_QUERY);
  const handleChange = (event: MediaQueryListEvent) => {
    onChange(event.matches ? 'dark' : 'light');
  };

  query.addEventListener('change', handleChange);

  return () => query.removeEventListener('change', handleChange);
}
