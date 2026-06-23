import api from '@/lib/axios';

export const reportsApi = {
  getOverview: (params) => api.get('/reports/overview', { params }).then((res) => res.data.data),
  getExpenseReport: (params) => api.get('/expense-report', { params }).then((res) => res.data.data),
  getBookingsReport: (params) => api.get('/bookings-report', { params }).then((res) => res.data.data),
  getPaymentsReport: (params) => api.get('/payments-report', { params }).then((res) => res.data.data),
  getRevenueReport: (params) => api.get('/revenue-report', { params }).then((res) => res.data.data),
  getCommissionReport: (params) => api.get('/commission', { params }).then((res) => res.data.data),
  getServiceProviderPerformance: (params) => api.get('/service-provider-report', { params }).then((res) => res.data.data),
  getServiceProviderAssignments: (params) => api.get('/service-provider-report/assignments', { params }).then((res) => res.data.data),
  getTeamPerformanceReport: (params) => api.get('/team-performance-report', { params }).then((res) => res.data.data),
};
