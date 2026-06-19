import { createResourceHooks } from '@/hooks/useResource';
import { servicesApi } from './services.api';

const hooks = createResourceHooks('services', servicesApi);

export const useServices = hooks.useList;
export const useService = hooks.useItem;
export const useCreateService = hooks.useCreate;
export const useUpdateService = hooks.useUpdate;
export const useDeleteService = hooks.useRemove;
