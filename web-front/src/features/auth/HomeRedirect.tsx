import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

import { ROUTES } from '@/app/routes';
import { clearReturnTo, peekReturnTo } from '@/lib/session-expiry';

/** Where sign-in lands: the page the expired session was on, otherwise the applications list. */
export function HomeRedirect() {
  // Peeked, then cleared in an effect, so a double render in StrictMode reads the same target.
  const [target] = useState(() => peekReturnTo() ?? ROUTES.applications);

  useEffect(() => {
    clearReturnTo();
  }, []);

  return <Navigate to={target} replace />;
}
