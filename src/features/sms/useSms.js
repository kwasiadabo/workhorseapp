import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { smsApi } from './sms.api';

export const useAudiencePreview = (params, options = {}) =>
  useQuery({
    queryKey: ['sms', 'audience', params],
    queryFn: () => smsApi.previewAudience(params),
    ...options,
  });

export const useSendCampaign = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: smsApi.sendCampaign,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sms', 'campaigns'] }),
  });
};

export const useSmsCampaigns = (params = {}) =>
  useQuery({
    queryKey: ['sms', 'campaigns', params],
    queryFn: () => smsApi.listCampaigns(params),
    placeholderData: (prev) => prev,
  });
