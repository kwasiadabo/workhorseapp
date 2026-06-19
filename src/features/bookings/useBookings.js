import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createResourceHooks } from '@/hooks/useResource';
import { paymentsApi } from '@/features/payments/payments.api';
import { bookingsApi } from './bookings.api';

const hooks = createResourceHooks('bookings', bookingsApi);

export const useBookingsList = hooks.useList;
export const useBooking = hooks.useItem;
export const useCreateBooking = hooks.useCreate;
export const useUpdateBooking = hooks.useUpdate;
export const useDeleteBooking = hooks.useRemove;

const useBookingSubMutation = (mutationFn) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bookings', 'detail', variables.bookingId] });
      queryClient.invalidateQueries({ queryKey: ['bookings', 'list'] });
    },
  });
};

export const useAddBookingService = () =>
  useBookingSubMutation(({ bookingId, data }) => bookingsApi.addService(bookingId, data));

export const useRemoveBookingService = () =>
  useBookingSubMutation(({ bookingId, bookingServiceId }) => bookingsApi.removeService(bookingId, bookingServiceId));

export const useAddAssignment = () =>
  useBookingSubMutation(({ bookingId, data }) => bookingsApi.addAssignment(bookingId, data));

export const useUpdateAssignment = () =>
  useBookingSubMutation(({ bookingId, assignmentId, data }) =>
    bookingsApi.updateAssignment(bookingId, assignmentId, data)
  );

export const useRemoveAssignment = () =>
  useBookingSubMutation(({ bookingId, assignmentId }) => bookingsApi.removeAssignment(bookingId, assignmentId));

export const useCreateBookingPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: paymentsApi.create,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bookings', 'detail', variables.bookingId] });
      queryClient.invalidateQueries({ queryKey: ['bookings', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['payments', 'list'] });
    },
  });
};
