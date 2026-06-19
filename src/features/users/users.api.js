import api from '@/lib/axios';
import { createResourceApi } from '@/lib/apiResource';

export const usersApi = {
  ...createResourceApi('/users'),
  resetPassword: (id) => api.post(`/users/${id}/reset-password`).then((res) => res.data.data),
};
