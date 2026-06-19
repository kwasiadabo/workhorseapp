import { Navigate, Outlet } from 'react-router-dom';

import useAuthStore from '@/store/authStore';

// Gate a route subtree by role and/or permission. A user passes if they match
// ANY of the given roles, AND ANY of the given permissions (when provided).
export default function RoleRoute({ roles = [], permissions = [] }) {
  const hasRole = useAuthStore((s) => s.hasRole);
  const hasPermission = useAuthStore((s) => s.hasPermission);

  const roleOk = roles.length === 0 || roles.some((role) => hasRole(role));
  const permissionOk = permissions.length === 0 || permissions.some((permission) => hasPermission(permission));

  if (!roleOk || !permissionOk) {
    return <Navigate to="/403" replace />;
  }

  return <Outlet />;
}
