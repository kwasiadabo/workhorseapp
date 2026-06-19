import { Navigate, Outlet } from 'react-router-dom';

import useAuthStore from '@/store/authStore';

export default function GuestRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  if (isAuthenticated) {
    const redirectTo = user?.role === 'super_admin' ? '/admin/tenants' : '/app';
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
}
