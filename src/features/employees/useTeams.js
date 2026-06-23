import { createResourceHooks } from '@/hooks/useResource';
import { teamsApi } from './teams.api';

const hooks = createResourceHooks('teams', teamsApi);

export const useTeams = hooks.useList;
export const useTeam = hooks.useItem;
export const useCreateTeam = hooks.useCreate;
export const useUpdateTeam = hooks.useUpdate;
export const useDeleteTeam = hooks.useRemove;
