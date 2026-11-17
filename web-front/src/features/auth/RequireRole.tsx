import { Navigate, Outlet } from 'react-router-dom';
import type { UserRole } from '@job-tracker/shared';

import { ROUTES } from '@/app/routes';
import { AuthGateLoader } from '@/features/auth/components/AuthGateLoader';
import { useCurrentUser } from '@/features/auth/use-current-user';

/**
 * Gates a route on the role, inside `RequireAuth` which already has a session.
 * Short of the role it redirects rather than refusing, so a guessed URL says
 * nothing about what is behind it.
 */
export function RequireRole({ role }: { role: UserRole }) {
  const { user, isLoading } = useCurrentUser();

  if (isLoading) {
    return <AuthGateLoader />;
  }

  if (user?.role !== role) {
    return <Navigate to={ROUTES.applications} replace />;
  }

  return <Outlet />;
}
