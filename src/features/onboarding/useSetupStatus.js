import { useQuery } from '@tanstack/react-query';

import useAuthStore from '@/store/authStore';
import { getSetupStatus } from './setup.api';

// Drives both the persistent owner setup-gate (ProtectedRoute) and the
// booking-creation block (BookingCreatePage) — same `bookings.create` set of
// roles that the backend route is gated on.
export const useSetupStatus = () => {
  const canQuery = useAuthStore((s) => s.hasPermission('bookings.create'));

  return useQuery({
    queryKey: ['setup-status'],
    queryFn: getSetupStatus,
    enabled: canQuery,
    staleTime: 60_000,
  });
};
