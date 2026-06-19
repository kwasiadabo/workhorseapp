import { createResourceHooks } from '@/hooks/useResource';
import { bankTransactionsApi } from './bankTransactions.api';

const hooks = createResourceHooks('bank-transactions', bankTransactionsApi);

export const useBankTransactions = hooks.useList;
export const useBankTransaction = hooks.useItem;
export const useCreateBankTransaction = hooks.useCreate;
export const useUpdateBankTransaction = hooks.useUpdate;
export const useDeleteBankTransaction = hooks.useRemove;
