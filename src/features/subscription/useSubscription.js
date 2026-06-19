import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subscriptionApi } from './subscription.api';

export const useSubscription = () =>
  useQuery({
    queryKey: ['subscription'],
    queryFn: subscriptionApi.get,
  });

export const useActivatePlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: subscriptionApi.activate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
    },
  });
};
