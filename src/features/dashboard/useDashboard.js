import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from './dashboard.api';

export const useMyDashboard = (options = {}) =>
  useQuery({ queryKey: ['dashboard', 'me'], queryFn: dashboardApi.getMine, ...options });

export const useDashboardSummary = (options = {}) =>
  useQuery({ queryKey: ['dashboard', 'summary'], queryFn: dashboardApi.getSummary, ...options });
