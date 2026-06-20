import { createResourceHooks } from '@/hooks/useResource';
import { vehiclesApi } from './vehicles.api';

const {
  useList: useVehicles,
  useItem: useVehicle,
  useCreate: useCreateVehicle,
  useUpdate: useUpdateVehicle,
  useRemove: useDeleteVehicle,
} = createResourceHooks('vehicles', vehiclesApi);

export { useVehicles, useVehicle, useCreateVehicle, useUpdateVehicle, useDeleteVehicle };
