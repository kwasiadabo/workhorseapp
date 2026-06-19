import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// Builds the standard set of list/detail/create/update/remove query hooks
// for a resource backed by `createResourceApi`.
export const createResourceHooks = (key, resourceApi) => {
  const useList = (params = {}, options = {}) =>
    useQuery({
      queryKey: [key, 'list', params],
      queryFn: () => resourceApi.list(params),
      placeholderData: (previous) => previous,
      ...options,
    });

  const useItem = (id) =>
    useQuery({
      queryKey: [key, 'detail', id],
      queryFn: () => resourceApi.getById(id),
      enabled: Boolean(id),
    });

  const useCreate = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: resourceApi.create,
      onSuccess: () => queryClient.invalidateQueries({ queryKey: [key, 'list'] }),
    });
  };

  const useUpdate = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, data }) => resourceApi.update(id, data),
      onSuccess: (_data, variables) => {
        queryClient.invalidateQueries({ queryKey: [key, 'list'] });
        queryClient.invalidateQueries({ queryKey: [key, 'detail', variables.id] });
      },
    });
  };

  const useRemove = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: resourceApi.remove,
      onSuccess: () => queryClient.invalidateQueries({ queryKey: [key, 'list'] }),
    });
  };

  return { useList, useItem, useCreate, useUpdate, useRemove };
};
