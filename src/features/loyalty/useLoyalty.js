import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { loyaltyApi } from './loyalty.api';

export const useLoyaltySettings = () =>
  useQuery({ queryKey: ['loyalty', 'settings'], queryFn: loyaltyApi.getSettings });

export const useUpdateLoyaltySettings = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: loyaltyApi.updateSettings,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['loyalty', 'settings'] }),
  });
};

export const useLoyaltyCustomers = (params) =>
  useQuery({
    queryKey: ['loyalty', 'customers', params],
    queryFn: () => loyaltyApi.listCustomerPoints(params),
    placeholderData: (prev) => prev,
  });

export const useRedeemPoints = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: loyaltyApi.redeemPoints,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['loyalty', 'customers'] });
      qc.invalidateQueries({ queryKey: ['customers'] });
    },
  });
};
