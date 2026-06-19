import api from '@/lib/axios';

export const subscriptionApi = {
  get: () => api.get('/subscription').then((res) => res.data.data),
  activate: (data) => api.post('/subscription/activate', data).then((res) => res.data.data),
  initializePayment: (data) =>
    api.post('/subscription/payment/initialize', data).then((res) => res.data.data),
  verifyPayment: (data) =>
    api.post('/subscription/payment/verify', data).then((res) => res.data.data),
};
