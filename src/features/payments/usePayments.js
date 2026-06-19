import { createResourceHooks } from '@/hooks/useResource';
import { paymentsApi } from './payments.api';

const hooks = createResourceHooks('payments', paymentsApi);

export const usePayments = hooks.useList;
export const usePayment = hooks.useItem;
export const useCreatePayment = hooks.useCreate;
