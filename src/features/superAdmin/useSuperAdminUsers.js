import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createResourceHooks } from '@/hooks/useResource';
import { adminUsersApi } from './superAdminUsers.api';

const hooks = createResourceHooks('admin-users', adminUsersApi);

export const useAdminUsers = hooks.useList;
export const useAdminUser = hooks.useItem;
export const useUpdateAdminUser = hooks.useUpdate;

export const useResetAdminUserPassword = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminUsersApi.resetPassword,
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users', 'detail', id] });
    },
  });
};
