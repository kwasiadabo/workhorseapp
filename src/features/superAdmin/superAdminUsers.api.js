import api from '@/lib/axios';
import { createResourceApi } from '@/lib/apiResource';

export const adminUsersApi = {
  ...createResourceApi('/admin/users'),
  resetPassword: (id) => api.post(`/admin/users/${id}/reset-password`).then((res) => res.data.data),
};
