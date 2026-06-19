import { Navigate, Outlet, useLocation } from 'react-router-dom';

import useAuthStore from '@/store/authStore';

export default function ProtectedRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user?.mustChangePassword && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }

  // Block access for non-active tenant accounts and redirect to the subscription page.
  // Super admins (no tenantId) are exempt. The subscription page itself is always reachable.
  const BLOCKED_STATUSES = ['expired', 'suspended', 'cancelled'];
  const SUBSCRIPTION_PATHS = ['/app/subscription', '/app/subscription/callback'];
  if (
    BLOCKED_STATUSES.includes(user?.subscriptionStatus) &&
    user?.tenantId &&
    !SUBSCRIPTION_PATHS.includes(location.pathname)
  ) {
    return <Navigate to="/app/subscription" replace />;
  }

  return <Outlet />;
}
