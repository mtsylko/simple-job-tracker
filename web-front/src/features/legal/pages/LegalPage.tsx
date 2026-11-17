import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';

import { ROUTES } from '@/app/routes';
import { SignInLanguageSwitch } from '@/features/auth/components/SignInLanguageSwitch';
import { bundledResources } from '@/i18n';

import { LegalText } from '../components/LegalText';
import {
  LEGAL_EFFECTIVE_DATE,
  LEGAL_ENTITY,
  type LegalDocument
} from '../legal-entity';

/** The public privacy policy or terms of service, readable signed in or out. */
export function LegalPage({ document }: { document: LegalDocument }) {
  const { t, i18n } = useTranslation('legal');
  const sectionKeys = Object.keys(bundledResources.en.legal[document].sections);
  const other: LegalDocument = document === 'privacy' ? 'terms' : 'privacy';

  const updated = new Intl.DateTimeFormat(i18n.resolvedLanguage, {
    dateStyle: 'long'
  }).format(new Date(`${LEGAL_EFFECTIVE_DATE}T00:00:00`));

  // Switching between the two documents lands at the top, not mid-page.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [document]);

  return (
    <div className="flex min-h-0 flex-1 overflow-y-auto bg-warm-bg">
      <div className="mx-auto flex w-full max-w-[720px] flex-col gap-10 px-4 py-10 sm:px-8 sm:py-14">
        <div className="flex items-center justify-between gap-4">
          <Link
            to={ROUTES.home}
            className="flex items-center gap-2 text-sm text-ink-2 hover:text-ink"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            {t('nav.back')}
          </Link>
          <SignInLanguageSwitch />
        </div>

        <header className="flex flex-col gap-3">
          <h1 className="m-0 font-serif text-4xl leading-display tracking-display text-ink">
            {t(`${document}.title`)}
          </h1>
          <p className="text-sm text-ink-3">
            {t('nav.updated', { date: updated })}
            {i18n.resolvedLanguage !== 'pl' && (
              <>
                <br />
                {t('nav.bindingVersion')}
              </>
            )}
          </p>
          <p className="text-base text-ink-2">{t(`${document}.intro`)}</p>
        </header>

        <nav
          aria-label={t('nav.contents')}
          className="rounded-2xl border border-border bg-card p-5"
        >
          <p className="section-label">{t('nav.contents')}</p>
          <ol className="mt-3 flex list-decimal flex-col gap-1.5 pl-5 text-sm">
            {sectionKeys.map((key) => (
              <li key={key}>
                <a
                  href={`#${key}`}
                  className="text-ink-2 underline-offset-2 hover:text-ink hover:underline"
                >
                  {t(`${document}.sections.${key}.title`)}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="flex flex-col gap-8 text-sm leading-relaxed text-ink-2">
          {sectionKeys.map((key, i) => (
            <section
              key={key}
              id={key}
              className="flex scroll-mt-6 flex-col gap-3"
            >
              <h2 className="m-0 font-serif text-xl text-ink">
                {i + 1}. {t(`${document}.sections.${key}.title`)}
              </h2>
              <LegalText
                text={t(`${document}.sections.${key}.body`, LEGAL_ENTITY)}
              />
            </section>
          ))}
        </div>

        <footer className="border-t border-border pt-6 text-sm">
          <Link
            to={other === 'privacy' ? ROUTES.privacy : ROUTES.terms}
            className="text-clay underline underline-offset-2 hover:text-ink"
          >
            {t(`nav.${other}`)}
          </Link>
        </footer>
      </div>
    </div>
  );
}
