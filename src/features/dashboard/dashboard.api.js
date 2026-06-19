import api from '@/lib/axios';

export const dashboardApi = {
  getMine: () => api.get('/dashboard/me').then((res) => res.data.data),
  getSummary: () => api.get('/dashboard/summary').then((res) => res.data.data),
};
