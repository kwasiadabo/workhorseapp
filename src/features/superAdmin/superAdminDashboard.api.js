import api from '@/lib/axios';

export const superAdminDashboardApi = {
  getOverview: () => api.get('/admin/dashboard/overview').then((res) => res.data.data),
};
