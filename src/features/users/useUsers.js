import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createResourceHooks } from '@/hooks/useResource';
import { usersApi } from './users.api';

const hooks = createResourceHooks('users', usersApi);

export const useUsers = hooks.useList;
export const useUser = hooks.useItem;
export const useCreateUser = hooks.useCreate;
export const useUpdateUser = hooks.useUpdate;
export const useDeactivateUser = hooks.useRemove;

export const useResetUserPassword = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: usersApi.resetPassword,
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['users', 'detail', id] });
    },
  });
};
