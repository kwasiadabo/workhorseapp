import { useQuery } from '@tanstack/react-query';

import { superAdminDashboardApi } from './superAdminDashboard.api';

export const useSuperAdminDashboard = () =>
  useQuery({
    queryKey: ['admin', 'dashboard', 'overview'],
    queryFn: superAdminDashboardApi.getOverview,
    placeholderData: (prev) => prev,
  });
