import { createResourceHooks } from '@/hooks/useResource';
import { bankAccountsApi } from './bankAccounts.api';

const hooks = createResourceHooks('bank-accounts', bankAccountsApi);

export const useBankAccounts = hooks.useList;
export const useBankAccount = hooks.useItem;
export const useCreateBankAccount = hooks.useCreate;
export const useUpdateBankAccount = hooks.useUpdate;
export const useDeleteBankAccount = hooks.useRemove;
