import { useTranslation } from 'react-i18next';

import { SIGN_IN_HIGHLIGHTS } from '../sign-in-highlights';

/**
 * Spacing here comes from flex `gap`, never from margin utilities on a `<p>`:
 * `index.css` sets an unlayered `p { margin: 0 }`, which outranks everything in
 * `@layer utilities`, so `mt-*` on a paragraph silently computes to 0.
 */
export function SignInBrandPanel() {
  const { t } = useTranslation(['auth', 'common']);

  return (
    <aside className="relative hidden flex-col justify-between gap-16 border-r border-warm-line bg-warm-surface-2 px-12 py-14 lg:flex">
      {/* Decorations live in their own clipped layer so the panel itself can
          grow with its content on short viewports. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -top-32 -left-24 size-96 rounded-full bg-clay-soft opacity-70 blur-3xl" />
        <div className="absolute -right-32 -bottom-40 size-96 rounded-full bg-clay-soft opacity-40 blur-3xl" />
      </div>

      <div className="relative flex items-center gap-2.5">
        <img src="/icon.svg" alt="" className="size-8 shrink-0 rounded-md" />
        {/* `text-box` trims the line box to cap-height/baseline so `items-center`
            centres the letterforms against the icon rather than the font's
            asymmetric ascent/descent, which sat the wordmark ~2px high. */}
        <span className="font-serif text-lg font-medium tracking-tight text-ink [text-box:cap_alphabetic]">
          {t('brand.name', { ns: 'common' })}
        </span>
      </div>

      <div className="relative flex max-w-md flex-col gap-4">
        <p className="section-label">{t('signIn.brand.tagline')}</p>
        <p className="text-balance font-serif text-4xl leading-display tracking-display text-ink">
          {t('signIn.brand.heading')}
        </p>
        <p className="text-base text-ink-2">{t('signIn.brand.body')}</p>

        <ul className="mt-6 flex flex-col gap-5">
          {SIGN_IN_HIGHLIGHTS.map(({ key, icon: Icon }) => (
            <li key={key} className="flex gap-3.5">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-warm-line bg-warm-surface text-clay">
                <Icon className="size-4" />
              </span>
              <div className="flex min-w-0 flex-col gap-0.5">
                <p className="text-sm font-medium text-ink">
                  {t(`signIn.brand.highlights.${key}.title`)}
                </p>
                <p className="text-sm text-ink-2">
                  {t(`signIn.brand.highlights.${key}.description`)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <p className="relative text-xs text-ink-3">
        {t('signIn.brand.footnote')}
      </p>
    </aside>
  );
}
