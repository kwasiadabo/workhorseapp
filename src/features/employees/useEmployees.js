import { createResourceHooks } from '@/hooks/useResource';
import { employeesApi } from './employees.api';

const hooks = createResourceHooks('employees', employeesApi);

export const useEmployees = hooks.useList;
export const useEmployee = hooks.useItem;
export const useCreateEmployee = hooks.useCreate;
export const useUpdateEmployee = hooks.useUpdate;
export const useDeleteEmployee = hooks.useRemove;
