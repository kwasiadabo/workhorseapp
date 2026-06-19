import { createResourceHooks } from '@/hooks/useResource';
import { expensesApi } from './expenses.api';

const hooks = createResourceHooks('expenses', expensesApi);

export const useExpenses = hooks.useList;
export const useExpense = hooks.useItem;
export const useCreateExpense = hooks.useCreate;
export const useUpdateExpense = hooks.useUpdate;
export const useDeleteExpense = hooks.useRemove;
