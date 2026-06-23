import api from '@/lib/axios';

export const getSetupStatus = () => api.get('/setup-status').then((res) => res.data.data);
