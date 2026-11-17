import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * Shown while `RequireAuth` waits on the session probe. Rendering nothing here
 * turns any API slowness into a blank white page before the sign-in redirect.
 */
export function AuthGateLoader() {
  const { t } = useTranslation(['auth', 'common']);

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-svh flex-col items-center justify-center gap-4 bg-warm-bg"
    >
      <div className="flex items-center gap-2.5">
        <img src="/icon.svg" alt="" className="size-8 shrink-0 rounded-md" />
        <span className="font-serif text-lg font-medium tracking-tight text-ink">
          {t('brand.name', { ns: 'common' })}
        </span>
      </div>

      <p className="flex items-center gap-2 text-sm text-ink-3">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        {t('gate.checkingSession')}
      </p>
    </div>
  );
}
