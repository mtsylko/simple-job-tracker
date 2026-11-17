import { useEffect, useId, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { useAnalyticsConsentStore } from '@/lib/analytics-consent-store';
import { isAnalyticsEnabled } from '@/lib/google-analytics';

export function CookieConsentBanner() {
  const { t } = useTranslation('common');
  const choice = useAnalyticsConsentStore((state) => state.choice);
  const reviewing = useAnalyticsConsentStore((state) => state.reviewing);
  const choose = useAnalyticsConsentStore((state) => state.choose);
  const titleId = useId();
  const bannerRef = useRef<HTMLDivElement>(null);

  // Focus follows only when asked for from "Cookie settings", never on a first visit.
  useEffect(() => {
    if (reviewing) bannerRef.current?.focus();
  }, [reviewing]);

  if (!isAnalyticsEnabled || (choice !== null && !reviewing)) return null;

  return (
    <Card
      ref={bannerRef}
      role="region"
      aria-labelledby={titleId}
      tabIndex={-1}
      className="fixed inset-x-4 bottom-4 z-50 shadow-lg outline-none sm:right-auto sm:w-full sm:max-w-sm"
    >
      <CardHeader>
        <CardTitle id={titleId}>{t('cookieConsent.title')}</CardTitle>
        <CardDescription className="flex flex-col gap-1">
          <p>{t('cookieConsent.body')}</p>
          <p>
            {choice === null
              ? t('cookieConsent.withdraw')
              : t(`cookieConsent.current.${choice}`)}
          </p>
        </CardDescription>
      </CardHeader>
      {/* Same variant and width for both, so neither answer is the nudged one */}
      <CardFooter className="grid grid-cols-2 gap-2">
        <Button variant="outline" onClick={() => choose('denied')}>
          {t('cookieConsent.reject')}
        </Button>
        <Button variant="outline" onClick={() => choose('granted')}>
          {t('cookieConsent.accept')}
        </Button>
      </CardFooter>
    </Card>
  );
}
