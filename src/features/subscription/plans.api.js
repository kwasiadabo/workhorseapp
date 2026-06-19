import api from '@/lib/axios';

export const plansApi = {
  list: () => api.get('/plans').then((res) => res.data.data),
};
