import { createResourceHooks } from '@/hooks/useResource';
import { tenantsApi } from './superAdminTenants.api';

const hooks = createResourceHooks('admin-tenants', tenantsApi);

export const useTenants = hooks.useList;
export const useTenant = hooks.useItem;
export const useUpdateTenant = hooks.useUpdate;
export const useCancelTenant = hooks.useRemove;
