import { ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';

import { ROUTES } from '@/app/routes';
import { Button } from '@/components/ui/button';
import { trackLogin } from '@/lib/analytics-events';
import { useAnalyticsConsentStore } from '@/lib/analytics-consent-store';
import { isAnalyticsEnabled } from '@/lib/google-analytics';

import { SIGN_IN_HIGHLIGHTS } from '../sign-in-highlights';

import { GoogleIcon } from './GoogleIcon';
import { SignInLanguageSwitch } from './SignInLanguageSwitch';

const LEGAL_LINK = 'text-ink-2 underline underline-offset-2 hover:text-ink';

/**
 * Spacing here comes from flex `gap`, never from margin utilities on a `<p>`:
 * `index.css` sets an unlayered `p { margin: 0 }`, which outranks everything in
 * `@layer utilities`, so `mt-*` on a paragraph silently computes to 0.
 */
export function SignInPanel() {
  const { t } = useTranslation(['auth', 'common']);
  const reviewCookieConsent = useAnalyticsConsentStore((state) => state.review);

  return (
    <div className="flex w-full max-w-sm flex-col items-start">
      {/* Brand mark — the side panel is hidden on small screens */}
      <div className="mb-10 flex items-center gap-2.5 lg:hidden">
        <img src="/icon.svg" alt="" className="size-8 shrink-0 rounded-md" />
        <span className="font-serif text-lg font-medium tracking-tight text-ink">
          {t('brand.name', { ns: 'common' })}
        </span>
      </div>

      <div className="flex flex-col gap-3">
        <p className="section-label">{t('signIn.label')}</p>

        <h1 className="m-0 font-serif text-4xl leading-display tracking-display text-ink">
          {t('signIn.heading')}
        </h1>

        <p className="text-base text-ink-2">{t('signIn.subtitle')}</p>
      </div>

      <Button
        variant="outline"
        // `flex` overrides the variant's `inline-flex` so the button is a
        // block-level box in the column rather than sitting in a line box.
        className="mt-8 flex h-11 w-full gap-2.5 rounded-xl border-warm-line-2 bg-warm-surface text-sm text-ink hover:bg-warm-surface-2"
        onClick={() => {
          trackLogin();
          window.location.href = '/auth/google';
        }}
      >
        <GoogleIcon />
        {t('signIn.continueWithGoogle')}
      </Button>

      <div className="mt-4 flex items-start gap-2 text-xs text-ink-3">
        <ShieldCheck className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
        <div className="flex flex-col items-start gap-1">
          <p>{t('signIn.privacyNote')}</p>
          <p>
            <Trans
              i18nKey="signInConsent"
              ns="legal"
              components={{
                terms: <Link to={ROUTES.terms} className={LEGAL_LINK} />,
                privacy: <Link to={ROUTES.privacy} className={LEGAL_LINK} />
              }}
            />
          </p>
          {isAnalyticsEnabled && (
            <Button
              variant="link"
              className="h-auto p-0 text-xs text-ink-3 underline hover:text-ink"
              onClick={reviewCookieConsent}
            >
              {t('cookieConsent.settings', { ns: 'common' })}
            </Button>
          )}
        </div>
      </div>

      {/* Condensed version of the side panel highlights. Sits the same
          distance below the block as the brand mark sits above it. */}
      <ul className="mt-10 grid w-full grid-cols-3 gap-3 lg:hidden">
        {SIGN_IN_HIGHLIGHTS.map(({ key, icon: Icon }) => (
          <li
            key={key}
            className="flex flex-col items-center gap-2 text-center"
          >
            <Icon className="size-4 text-clay" />
            <span className="text-xs text-ink-3">
              {t(`signIn.brand.highlights.${key}.title`)}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-10 self-center">
        <SignInLanguageSwitch />
      </div>
    </div>
  );
}
