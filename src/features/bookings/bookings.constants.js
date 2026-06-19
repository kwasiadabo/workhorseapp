import { CalendarCheck, CheckCircle2, CircleDot, Clock, RotateCcw, UserX, XCircle } from 'lucide-react';

export const BOOKING_STATUSES = ['confirmed', 'in_progress', 'awaiting_payment', 'completed', 'cancelled', 'no_show'];

export const BOOKING_STATUS_VARIANTS = {
  confirmed: 'secondary',
  in_progress: 'info',
  awaiting_payment: 'warning',
  completed: 'success',
  cancelled: 'outline',
  no_show: 'destructive',
};

export const BOOKING_STATUS_ICONS = {
  confirmed: CalendarCheck,
  in_progress: CircleDot,
  awaiting_payment: Clock,
  completed: CheckCircle2,
  cancelled: XCircle,
  no_show: UserX,
};

// Statuses that close out a booking — once reached, the booking no longer
// accepts new services, staff assignments or payments.
export const TERMINAL_BOOKING_STATUSES = ['completed', 'cancelled', 'no_show'];

// The only statuses staff can set manually. Every other transition
// (confirmed -> in_progress -> awaiting_payment -> completed) happens
// automatically as assignments/payments progress.
export const MANUAL_BOOKING_STATUSES = ['cancelled', 'no_show'];

export const ASSIGNMENT_STATUSES = ['waiting', 'in_progress', 'completed', 'cancelled'];

export const ASSIGNMENT_STATUS_VARIANTS = {
  waiting: 'secondary',
  in_progress: 'info',
  completed: 'success',
  cancelled: 'outline',
};

export const ASSIGNMENT_STATUS_ICONS = {
  waiting: Clock,
  in_progress: CircleDot,
  completed: CheckCircle2,
  cancelled: XCircle,
};

// The single assignment designated as team lead — the only assignee who can
// mark any assignment as completed or (without payments.create) record
// payments for this booking.
export const getTeamLeadAssignment = (assignments = []) => assignments.find((a) => a.isTeamLead);

export const PAYMENT_METHODS = ['cash', 'card', 'mobile_money', 'bank_transfer', 'other'];

export const PAYMENT_STATUS_VARIANTS = {
  pending: 'warning',
  completed: 'success',
  failed: 'destructive',
  refunded: 'info',
};

export const PAYMENT_STATUS_ICONS = {
  pending: Clock,
  completed: CheckCircle2,
  failed: XCircle,
  refunded: RotateCcw,
};

// Aggregate "how much of this booking has been paid for" status — distinct
// from PAYMENT_STATUS_* above, which describes a single Payment record.
export const PAYMENT_SUMMARY_VARIANTS = {
  unpaid: 'destructive',
  partial: 'warning',
  paid: 'success',
};

export const PAYMENT_SUMMARY_ICONS = {
  unpaid: XCircle,
  partial: Clock,
  paid: CheckCircle2,
};

export const SATISFACTION_RATING_OPTIONS = [
  { value: '1', label: '1 - Very dissatisfied' },
  { value: '2', label: '2 - Dissatisfied' },
  { value: '3', label: '3 - Neutral' },
  { value: '4', label: '4 - Satisfied' },
  { value: '5', label: '5 - Very satisfied' },
];

// Sums completed payments against a booking's total to determine what's
// still owed — used to gate marking a booking as "completed".
export const getBookingPaymentSummary = (booking) => {
  const payments = booking?.Payments ?? [];
  const paidAmount = payments
    .filter((payment) => payment.status === 'completed')
    .reduce((sum, payment) => sum + Number(payment.amount), 0);
  const balanceDue = Math.round(Math.max(Number(booking?.totalAmount ?? 0) - paidAmount, 0) * 100) / 100;
  const isFullyPaid = balanceDue <= 0;
  const paymentStatus = isFullyPaid ? 'paid' : paidAmount > 0 ? 'partial' : 'unpaid';
  return { paidAmount, balanceDue, isFullyPaid, paymentStatus };
};

export const formatDuration = (minutes) => {
  if (minutes == null || Number.isNaN(minutes) || minutes < 0) return null;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
};

// One row per assignment — combines whichever line item(s) it covers (the
// whole booking, or a single service if assigned to a specific one).
export const buildAssignmentRows = (bookings = []) =>
  bookings.flatMap((booking) => {
    const bookingServices = booking.bookingServices ?? [];
    const paymentSummary = getBookingPaymentSummary(booking);

    return (booking.assignments ?? []).map((assignment) => {
      const services = assignment.bookingServiceId
        ? bookingServices.filter((bs) => bs.id === assignment.bookingServiceId)
        : bookingServices;

      return {
        id: assignment.id,
        bookingId: booking.id,
        assignmentId: assignment.id,
        bookingNumber: booking.bookingNumber,
        scheduledAt: booking.scheduledAt,
        assignedAt: assignment.assignedAt,
        employeeId: assignment.employeeId,
        employeeName: `${assignment.Employee?.firstName ?? ''} ${assignment.Employee?.lastName ?? ''}`.trim() || '—',
        customer: booking.Customer?.name ?? '—',
        services: services.map((bs) => bs.Service?.name ?? 'Unknown service').join(', ') || 'Whole booking',
        durationMinutes: services.reduce((sum, bs) => sum + (bs.durationAtBooking ?? 0) * bs.quantity, 0),
        cost: services.reduce((sum, bs) => sum + Number(bs.priceAtBooking) * bs.quantity, 0),
        currency: services[0]?.Service?.currency ?? 'GH¢',
        status: assignment.status,
        paymentStatus: paymentSummary.paymentStatus,
        balanceDue: paymentSummary.balanceDue,
      };
    });
  });
