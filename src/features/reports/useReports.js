import { useQuery } from '@tanstack/react-query';

import { reportsApi } from './reports.api';

export const useReportsOverview = (params) =>
  useQuery({
    queryKey: ['reports', 'overview', params],
    queryFn: () => reportsApi.getOverview(params),
  });

export const useExpenseReport = (params) =>
  useQuery({
    queryKey: ['reports', 'expenses', params],
    queryFn: () => reportsApi.getExpenseReport(params),
  });

export const useBookingsReport = (params) =>
  useQuery({
    queryKey: ['reports', 'bookings', params],
    queryFn: () => reportsApi.getBookingsReport(params),
  });

export const usePaymentsReport = (params) =>
  useQuery({
    queryKey: ['reports', 'payments', params],
    queryFn: () => reportsApi.getPaymentsReport(params),
  });

export const useRevenueReport = (params) =>
  useQuery({
    queryKey: ['reports', 'revenue', params],
    queryFn: () => reportsApi.getRevenueReport(params),
    placeholderData: (prev) => prev,
  });

export const useCommissionReport = (params) =>
  useQuery({
    queryKey: ['reports', 'commission', params],
    queryFn: () => reportsApi.getCommissionReport(params),
    placeholderData: (prev) => prev,
  });

export const useServiceProviderPerformance = (params) =>
  useQuery({
    queryKey: ['reports', 'service-provider-performance', params],
    queryFn: () => reportsApi.getServiceProviderPerformance(params),
    placeholderData: (prev) => prev,
  });

export const useServiceProviderAssignments = (params, options = {}) =>
  useQuery({
    queryKey: ['reports', 'service-provider-assignments', params],
    queryFn: () => reportsApi.getServiceProviderAssignments(params),
    placeholderData: (prev) => prev,
    ...options,
  });
