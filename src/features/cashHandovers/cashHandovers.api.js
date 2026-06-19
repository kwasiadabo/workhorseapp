import api from '@/lib/axios';
import { createResourceApi } from '@/lib/apiResource';

export const cashHandoversApi = {
  ...createResourceApi('/cash-handovers'),
  preview: (params) => api.get('/cash-handovers/preview', { params }).then((res) => res.data.data),
  review: (id, data) => api.patch(`/cash-handovers/${id}/review`, data).then((res) => res.data.data),
};
