import { RouterProvider } from 'react-router-dom';

import { router } from '@/app/AppRoutes';
import { CookieConsentBanner } from '@/components/CookieConsentBanner';
import { Toaster } from '@/components/ui/sonner';

function App() {
  return (
    <>
      <RouterProvider router={router} />
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
    </>
  );
}

export default App;
