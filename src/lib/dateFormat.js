import { format } from 'date-fns';

export const DATE_FORMAT = 'dd-MMM-yyyy';
export const TIME_FORMAT = 'hh:mm a';
export const DATE_TIME_FORMAT = `${DATE_FORMAT}, ${TIME_FORMAT}`;

export function formatDate(date) {
  return format(new Date(date), DATE_FORMAT);
}

export function formatTime(date) {
  return format(new Date(date), TIME_FORMAT);
}

export function formatDateTime(date) {
  return format(new Date(date), DATE_TIME_FORMAT);
}
