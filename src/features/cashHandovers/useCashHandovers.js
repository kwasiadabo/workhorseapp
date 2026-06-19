import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createResourceHooks } from '@/hooks/useResource';
import { cashHandoversApi } from './cashHandovers.api';

const hooks = createResourceHooks('cashHandovers', cashHandoversApi);

export const useCashHandovers = hooks.useList;
export const useCashHandover = hooks.useItem;
export const useCreateCashHandover = hooks.useCreate;

export const usePreviewCashHandover = (params, options = {}) =>
  useQuery({
    queryKey: ['cashHandovers', 'preview', params],
    queryFn: () => cashHandoversApi.preview(params),
    ...options,
    enabled: Boolean(params?.periodStart && params?.periodEnd) && (options.enabled ?? true),
  });

export const useReviewCashHandover = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => cashHandoversApi.review(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cashHandovers', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['cashHandovers', 'detail', variables.id] });
    },
  });
};
