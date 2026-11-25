import { Outlet } from 'react-router-dom';
import { NuqsAdapter } from 'nuqs/adapters/react-router/v7';

import { useDocumentTitle } from './use-document-title';
import { useGoogleAnalytics } from './use-google-analytics';

/** Wraps every page: the hooks that follow the location, and the adapter the URL filters read. */
export function AppRoot() {
  // Before the page view, which reports document.title.
  useDocumentTitle();
  useGoogleAnalytics();

  return (
    <NuqsAdapter>
      <Outlet />
    </NuqsAdapter>
  );
}
