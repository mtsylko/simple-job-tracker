import { useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';

import { ROUTES } from '@/app/routes';
import { AuthGateLoader } from '@/features/auth/components/AuthGateLoader';
import { useCurrentUser } from '@/features/auth/use-current-user';
import { OnboardingPage } from '@/features/onboarding/OnboardingPage';

export function RequireAuth() {
  const { user, isLoading } = useCurrentUser();
  // The fetched user keeps its null onboardedAt until the next session probe.
  const [onboardedNow, setOnboardedNow] = useState(false);

  if (isLoading) {
    return <AuthGateLoader />;
  }

  if (!user) {
    return <Navigate to={ROUTES.signIn} replace />;
  }

  if (user.onboardedAt === null && !onboardedNow) {
    return <OnboardingPage onDone={() => setOnboardedNow(true)} />;
  }

  // Handed to the layout, so it needs no session request of its own.
  return <Outlet context={user} />;
}
