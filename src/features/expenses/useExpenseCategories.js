import { createResourceHooks } from '@/hooks/useResource';
import { expenseCategoriesApi } from './expenseCategories.api';

const hooks = createResourceHooks('expense-categories', expenseCategoriesApi);

export const useExpenseCategories = hooks.useList;
export const useExpenseCategory = hooks.useItem;
export const useCreateExpenseCategory = hooks.useCreate;
export const useUpdateExpenseCategory = hooks.useUpdate;
export const useDeleteExpenseCategory = hooks.useRemove;
