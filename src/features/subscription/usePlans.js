import { useQuery } from '@tanstack/react-query';
import { plansApi } from './plans.api';

export const usePlans = () =>
  useQuery({
    queryKey: ['plans'],
    queryFn: plansApi.list,
    staleTime: 10 * 60 * 1000,
  });
