import { createResourceHooks } from '@/hooks/useResource';
import { serviceCategoriesApi } from './serviceCategories.api';

const hooks = createResourceHooks('service-categories', serviceCategoriesApi);

export const useServiceCategories = hooks.useList;
export const useServiceCategory = hooks.useItem;
export const useCreateServiceCategory = hooks.useCreate;
export const useUpdateServiceCategory = hooks.useUpdate;
export const useDeleteServiceCategory = hooks.useRemove;
