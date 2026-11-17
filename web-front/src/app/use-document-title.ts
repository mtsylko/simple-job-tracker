import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { useRouteMeta } from './route-meta';
import { ROUTES } from './routes';

// index.html's marketing title, which the public sign-in page keeps.
const LANDING_TITLE = document.title;

/** `{page} — Job Tracker`; GA sends this with every page view, so route titles stay generic. */
export function useDocumentTitle(): void {
  const { pathname } = useLocation();
  const { t } = useTranslation('common');
  const { title } = useRouteMeta(pathname);
  const brand = t('brand.name');

  let documentTitle = t('layout.documentTitle', { page: title, brand });
  if (pathname === ROUTES.signIn) documentTitle = LANDING_TITLE;
  else if (title === brand) documentTitle = brand;

  useEffect(() => {
    document.title = documentTitle;
  }, [documentTitle]);
}
