import { createResourceHooks } from '@/hooks/useResource';
import { vehicleTypesApi } from './vehicleTypes.api';

const {
  useList: useVehicleTypes,
  useItem: useVehicleType,
  useCreate: useCreateVehicleType,
  useUpdate: useUpdateVehicleType,
  useRemove: useDeleteVehicleType,
} = createResourceHooks('vehicle-types', vehicleTypesApi);

export { useVehicleTypes, useVehicleType, useCreateVehicleType, useUpdateVehicleType, useDeleteVehicleType };
