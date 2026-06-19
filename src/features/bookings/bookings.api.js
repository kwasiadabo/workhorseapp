import api from '@/lib/axios';
import { createResourceApi } from '@/lib/apiResource';

export const bookingsApi = {
  ...createResourceApi('/bookings'),
  addService: (bookingId, data) => api.post(`/bookings/${bookingId}/services`, data).then((res) => res.data.data),
  removeService: (bookingId, bookingServiceId) =>
    api.delete(`/bookings/${bookingId}/services/${bookingServiceId}`).then((res) => res.data.data),
  addAssignment: (bookingId, data) => api.post(`/bookings/${bookingId}/assignments`, data).then((res) => res.data.data),
  updateAssignment: (bookingId, assignmentId, data) =>
    api.patch(`/bookings/${bookingId}/assignments/${assignmentId}`, data).then((res) => res.data.data),
  removeAssignment: (bookingId, assignmentId) =>
    api.delete(`/bookings/${bookingId}/assignments/${assignmentId}`).then((res) => res.data),
};
