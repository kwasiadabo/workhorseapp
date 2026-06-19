import { createResourceHooks } from '@/hooks/useResource';
import { customersApi } from './customers.api';

const hooks = createResourceHooks('customers', customersApi);

export const useCustomers = hooks.useList;
export const useCustomer = hooks.useItem;
export const useCreateCustomer = hooks.useCreate;
export const useUpdateCustomer = hooks.useUpdate;
export const useDeleteCustomer = hooks.useRemove;
