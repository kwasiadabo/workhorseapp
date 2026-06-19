import api from '@/lib/axios';

// Thin wrapper around the standard `{ success, data, meta }` REST shape used
// by every backend CRUD resource.
export const createResourceApi = (basePath) => ({
  list: (params) => api.get(basePath, { params }).then((res) => res.data),
  getById: (id) => api.get(`${basePath}/${id}`).then((res) => res.data.data),
  create: (data) => api.post(basePath, data).then((res) => res.data.data),
  update: (id, data) => api.patch(`${basePath}/${id}`, data).then((res) => res.data.data),
  remove: (id) => api.delete(`${basePath}/${id}`).then((res) => res.data),
});
