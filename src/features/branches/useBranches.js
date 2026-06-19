import { createResourceHooks } from '@/hooks/useResource';
import { branchesApi } from './branches.api';

const hooks = createResourceHooks('branches', branchesApi);

export const useBranches = hooks.useList;
export const useBranch = hooks.useItem;
export const useCreateBranch = hooks.useCreate;
export const useUpdateBranch = hooks.useUpdate;
export const useDeleteBranch = hooks.useRemove;
