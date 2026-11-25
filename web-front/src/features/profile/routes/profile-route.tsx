import { useTranslation } from 'react-i18next';

import { AccountSection } from '@/features/profile/components/AccountSection';

/** Public build: the candidate profile and answer bank serve the extension, so only the account tab is left. */
export function ProfileRoute() {
  const { t } = useTranslation('profile');

  return (
    <main className="flex min-h-0 flex-1 flex-col">
      <div className="px-4 pb-3 pt-5 sm:px-7 sm:pt-7">
        <h1 className="m-0 font-serif text-display font-light leading-tight tracking-tight text-foreground">
          {t('page.title')}
        </h1>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-20 pt-5 sm:px-7">
        <AccountSection />
      </div>
    </main>
  );
}
