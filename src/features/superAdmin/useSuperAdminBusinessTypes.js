import { createResourceHooks } from '@/hooks/useResource';
import { businessTypesApi } from './superAdminBusinessTypes.api';

const hooks = createResourceHooks('admin-business-types', businessTypesApi);

export const useBusinessTypes = hooks.useList;
export const useBusinessType = hooks.useItem;
export const useCreateBusinessType = hooks.useCreate;
export const useUpdateBusinessType = hooks.useUpdate;
export const useDeleteBusinessType = hooks.useRemove;
