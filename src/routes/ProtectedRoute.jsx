import { Navigate, Outlet, useLocation } from 'react-router-dom';

import useAuthStore from '@/store/authStore';
import { hasSeenOnboarding } from '@/lib/onboarding';
import { useSetupStatus } from '@/features/onboarding/useSetupStatus';

const BLOCKED_STATUSES = ['expired', 'suspended', 'cancelled'];
const SUBSCRIPTION_PATHS = ['/app/subscription', '/app/subscription/callback'];
const ONBOARDING_PATH = '/app/getting-started';

export default function ProtectedRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const location = useLocation();
  const { data: setupStatus } = useSetupStatus();

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

  // Tenant owners with incomplete initial setup (no branches/categories/
  // services/workers yet) are bounced to the getting-started checklist on
  // every navigation, not just once — this is real backend-derived state,
  // not a dismissible flag, so it keeps firing until setup is actually done.
  // While the status query is still loading, don't redirect (avoids a
  // flash/loop); it simply hasn't resolved as incomplete yet.
  const setupIncomplete = user?.role === 'tenant_owner' && setupStatus && !setupStatus.complete;

  // First-time tenant users (any role) land on the getting-started guide
  // once. Tracked client-side (per user id) so it doesn't fight the
  // subscription-blocked redirect above.
  const needsOnboarding = setupIncomplete || !hasSeenOnboarding(user?.id);

  if (
    user?.tenantId &&
    !isBlocked &&
    location.pathname.startsWith('/app') &&
    location.pathname !== ONBOARDING_PATH &&
    needsOnboarding
  ) {
    return <Navigate to={ONBOARDING_PATH} replace />;
  }

  return <Outlet />;
}
