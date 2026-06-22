import { Navigate, Outlet, useLocation } from 'react-router-dom';

import useAuthStore from '@/store/authStore';
import { hasSeenOnboarding } from '@/lib/onboarding';

const BLOCKED_STATUSES = ['expired', 'suspended', 'cancelled'];
const SUBSCRIPTION_PATHS = ['/app/subscription', '/app/subscription/callback'];
const ONBOARDING_PATH = '/app/getting-started';

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
  const isBlocked = BLOCKED_STATUSES.includes(user?.subscriptionStatus) && Boolean(user?.tenantId);
  if (isBlocked && !SUBSCRIPTION_PATHS.includes(location.pathname)) {
    return <Navigate to="/app/subscription" replace />;
  }

  // First-time tenant users land on the getting-started guide before the rest of the app.
  // Tracked client-side (per user id) so it only fires once and doesn't fight the
  // subscription-blocked redirect above.
  if (
    user?.tenantId &&
    !isBlocked &&
    location.pathname.startsWith('/app') &&
    location.pathname !== ONBOARDING_PATH &&
    !hasSeenOnboarding(user.id)
  ) {
    return <Navigate to={ONBOARDING_PATH} replace />;
  }

  return <Outlet />;
}
