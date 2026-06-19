import { createResourceHooks } from '@/hooks/useResource';
import { positionsApi } from './positions.api';

const hooks = createResourceHooks('positions', positionsApi);

export const usePositions = hooks.useList;
export const usePosition = hooks.useItem;
export const useCreatePosition = hooks.useCreate;
export const useUpdatePosition = hooks.useUpdate;
export const useDeletePosition = hooks.useRemove;
