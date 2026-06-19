import api from '@/lib/axios';

export const smsApi = {
  previewAudience: (params) => api.get('/sms/campaigns/audience', { params }).then((r) => r.data.data),
  sendCampaign: (data) => api.post('/sms/campaigns', data).then((r) => r.data.data),
  listCampaigns: (params) => api.get('/sms/campaigns', { params }).then((r) => r.data),
};
