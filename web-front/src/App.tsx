import { BrowserRouter } from 'react-router-dom';
import { NuqsAdapter } from 'nuqs/adapters/react-router/v7';

import { AppRoutes } from '@/app/AppRoutes';
import { CookieConsentBanner } from '@/components/CookieConsentBanner';
import { Toaster } from '@/components/ui/sonner';

function App() {
  return (
    <BrowserRouter>
      {/* Search-param state (the applications filters) reads the router through this. */}
      <NuqsAdapter>
        <AppRoutes />
      </NuqsAdapter>
      {/* Outside the routes, so it shows on the sign-in page as well */}
      <CookieConsentBanner />
      {/* Lifted to rest just above the feedback launcher in the same corner */}
      <Toaster
        position="bottom-right"
        offset={{ bottom: 80 }}
        mobileOffset={{ bottom: 72 }}
        richColors
        closeButton
      />
    </BrowserRouter>
  );
}

export default App;
