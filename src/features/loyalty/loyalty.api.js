import api from '@/lib/axios';

export const loyaltyApi = {
  getSettings: () => api.get('/loyalty/settings').then((r) => r.data.data),
  updateSettings: (data) => api.put('/loyalty/settings', data).then((r) => r.data.data),
  listCustomerPoints: (params) => api.get('/loyalty/customers', { params }).then((r) => r.data),
  redeemPoints: (customerId) => api.post(`/loyalty/customers/${customerId}/redeem`).then((r) => r.data.data),
};
