import { createResourceHooks } from '@/hooks/useResource';
import { banksApi } from './banks.api';

const hooks = createResourceHooks('banks', banksApi);

export const useBanks = hooks.useList;
export const useBank = hooks.useItem;
export const useCreateBank = hooks.useCreate;
export const useUpdateBank = hooks.useUpdate;
export const useDeleteBank = hooks.useRemove;
