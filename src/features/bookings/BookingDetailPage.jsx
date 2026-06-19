import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Crown, MessageCircle, Plus, Printer, Trash2, UserPlus, UserX, Wallet, XCircle } from 'lucide-react';
import { toast } from 'sonner';

import PageHeader from '@/components/shared/PageHeader';
import DataTable from '@/components/shared/DataTable';
import StatusBadge from '@/components/shared/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { formatDateTime } from '@/lib/dateFormat';
import { printReceipt, sendReceiptViaWhatsApp } from '@/lib/receipt';
import useAuthStore from '@/store/authStore';
import { useServices } from '@/features/services/useServices';
import {
  useAddBookingService,
  useBooking,
  useRemoveAssignment,
  useRemoveBookingService,
  useUpdateAssignment,
  useUpdateBooking,
} from './useBookings';
import {
  ASSIGNMENT_STATUSES,
  ASSIGNMENT_STATUS_ICONS,
  ASSIGNMENT_STATUS_VARIANTS,
  BOOKING_STATUS_ICONS,
  BOOKING_STATUS_VARIANTS,
  PAYMENT_STATUS_ICONS,
  PAYMENT_STATUS_VARIANTS,
  SATISFACTION_RATING_OPTIONS,
  TERMINAL_BOOKING_STATUSES,
  formatDuration,
  getBookingPaymentSummary,
} from './bookings.constants';
import AssignStaffDialog from './AssignStaffDialog';
import RecordPaymentDialog from './RecordPaymentDialog';

export default function BookingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const canManage = hasPermission('bookings.manage');
  const canRecordPayment = hasPermission('payments.create');

  const [serviceToAdd, setServiceToAdd] = useState('');
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  const { data: booking, isLoading } = useBooking(id);

  const { data: servicesData } = useServices({ limit: 100, isActive: 'true' }, { enabled: canManage });
  const services = servicesData?.data ?? [];

  const updateBooking = useUpdateBooking();
  const addService = useAddBookingService();
  const removeService = useRemoveBookingService();
  const updateAssignment = useUpdateAssignment();
  const removeAssignment = useRemoveAssignment();

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading booking...</p>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-muted-foreground">Booking not found.</p>
      </div>
    );
  }

  const bookingServices = booking.bookingServices ?? [];
  const assignments = booking.assignments ?? [];
  const payments = booking.Payments ?? [];

  const currency = bookingServices[0]?.Service?.currency ?? 'GH¢';
  const { balanceDue, isFullyPaid } = getBookingPaymentSummary(booking);
  const isTerminal = TERMINAL_BOOKING_STATUSES.includes(booking.status);

  const availableServices = services.filter((service) => !bookingServices.some((bs) => bs.serviceId === service.id));

  const handleStatusChange = (status) => {
    updateBooking.mutate(
      { id: booking.id, data: { status } },
      {
        onSuccess: () => toast.success('Booking status updated'),
        onError: (error) => toast.error(error?.response?.data?.message ?? 'Unable to update status'),
      }
    );
  };

  const handleAddService = () => {
    if (!serviceToAdd) return;
    addService.mutate(
      { bookingId: booking.id, data: { serviceId: serviceToAdd, quantity: 1 } },
      {
        onSuccess: () => {
          toast.success('Service added');
          setServiceToAdd('');
        },
        onError: (error) => toast.error(error?.response?.data?.message ?? 'Unable to add service'),
      }
    );
  };

  const handleRemoveService = (bookingServiceId) => {
    removeService.mutate(
      { bookingId: booking.id, bookingServiceId },
      {
        onSuccess: () => toast.success('Service removed'),
        onError: (error) => toast.error(error?.response?.data?.message ?? 'Unable to remove service'),
      }
    );
  };

  const handleAssignmentStatusChange = (assignmentId, status) => {
    updateAssignment.mutate(
      { bookingId: booking.id, assignmentId, data: { status } },
      {
        onSuccess: () => toast.success('Assignment updated'),
        onError: (error) => toast.error(error?.response?.data?.message ?? 'Unable to update assignment'),
      }
    );
  };

  const handleRemoveAssignment = (assignmentId) => {
    removeAssignment.mutate(
      { bookingId: booking.id, assignmentId },
      {
        onSuccess: () => toast.success('Assignment removed'),
        onError: (error) => toast.error(error?.response?.data?.message ?? 'Unable to remove assignment'),
      }
    );
  };

  const handleMakeTeamLead = (assignmentId) => {
    updateAssignment.mutate(
      { bookingId: booking.id, assignmentId, data: { isTeamLead: true } },
      {
        onSuccess: () => toast.success('Team lead updated'),
        onError: (error) => toast.error(error?.response?.data?.message ?? 'Unable to update team lead'),
      }
    );
  };

  const serviceColumns = [
    { key: 'name', header: 'Service', render: (row) => row.Service?.name ?? 'Unknown service' },
    {
      key: 'price',
      header: 'Unit price',
      className: 'text-right',
      render: (row) => `${row.Service?.currency ?? currency} ${Number(row.priceAtBooking).toFixed(2)}`,
    },
    {
      key: 'duration',
      header: 'Duration',
      className: 'text-right',
      render: (row) => `${row.durationAtBooking} min`,
    },
    { key: 'quantity', header: 'Qty', className: 'text-right' },
    {
      key: 'total',
      header: 'Total',
      className: 'text-right',
      render: (row) => `${row.Service?.currency ?? currency} ${(Number(row.priceAtBooking) * row.quantity).toFixed(2)}`,
    },
    ...(canManage
      ? [
          {
            key: 'actions',
            header: '',
            className: 'text-right',
            render: (row) => (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => handleRemoveService(row.id)}
                disabled={bookingServices.length <= 1}
                title={bookingServices.length <= 1 ? 'A booking must have at least one service' : undefined}
              >
                <Trash2 />
                <span className="sr-only">Remove</span>
              </Button>
            ),
          },
        ]
      : []),
  ];

  const assignmentColumns = [
    {
      key: 'employee',
      header: 'Service provider',
      render: (row) => (
        <div className="flex items-center gap-2">
          <span>{`${row.Employee?.firstName ?? ''} ${row.Employee?.lastName ?? ''}`.trim() || '—'}</span>
          {row.isTeamLead && (
            <Badge variant="secondary" className="gap-1">
              <Crown className="size-3" /> Lead
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: 'service',
      header: 'Service',
      render: (row) => bookingServices.find((bs) => bs.id === row.bookingServiceId)?.Service?.name ?? 'Whole booking',
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => {
        if (canManage) {
          return (
            <Select value={row.status} onValueChange={(value) => handleAssignmentStatusChange(row.id, value)}>
              <SelectTrigger className="w-36 capitalize">
                <SelectValue>{(value) => value?.replace('_', ' ')}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {ASSIGNMENT_STATUSES.map((opt) => (
                  <SelectItem key={opt} value={opt} className="capitalize">
                    {opt.replace('_', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        }

        return <StatusBadge status={row.status} variants={ASSIGNMENT_STATUS_VARIANTS} icons={ASSIGNMENT_STATUS_ICONS} />;
      },
    },
    {
      key: 'assignedAt',
      header: 'Assigned',
      render: (row) => formatDateTime(row.assignedAt),
    },
    ...(canManage
      ? [
          {
            key: 'actions',
            header: '',
            className: 'text-right',
            render: (row) => (
              <div className="flex items-center justify-end gap-1">
                {!row.isTeamLead && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    title="Make team lead"
                    onClick={() => handleMakeTeamLead(row.id)}
                  >
                    <Crown />
                    <span className="sr-only">Make team lead</span>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon-sm"
                  disabled={booking.status === 'completed'}
                  title={booking.status === 'completed' ? 'Cannot remove staff from a completed booking' : undefined}
                  onClick={() => handleRemoveAssignment(row.id)}
                >
                  <Trash2 />
                  <span className="sr-only">Remove</span>
                </Button>
              </div>
            ),
          },
        ]
      : []),
  ];

  const paymentColumns = [
    { key: 'amount', header: 'Amount', render: (row) => `${row.currency} ${Number(row.amount).toFixed(2)}` },
    {
      key: 'method',
      header: 'Method',
      className: 'capitalize',
      render: (row) => row.method?.replace('_', ' '),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <StatusBadge status={row.status} variants={PAYMENT_STATUS_VARIANTS} icons={PAYMENT_STATUS_ICONS} />
      ),
    },
    { key: 'referenceNumber', header: 'Reference', render: (row) => row.referenceNumber || '—' },
    { key: 'paidAt', header: 'Paid at', render: (row) => formatDateTime(row.paidAt) },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (row) =>
        row.status === 'completed' ? (
          <div className="flex justify-end gap-1">
            <Button variant="ghost" size="sm" onClick={() => printReceipt({ booking, payment: row })}>
              <Printer /> Receipt
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-[#25D366] hover:bg-[#25D366]/10 hover:text-[#25D366]"
              onClick={() => sendReceiptViaWhatsApp({ booking, payment: row })}
            >
              <MessageCircle /> WhatsApp
            </Button>
          </div>
        ) : null,
    },
  ];

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate('/app/bookings')} className="w-fit">
        <ArrowLeft /> Back to bookings
      </Button>

      <PageHeader
        title={`Booking ${booking.bookingNumber}`}
        description={`${booking.Customer?.name ?? ''} · ${booking.Branch?.name ?? ''}`}
      />

      <div className="grid gap-6 lg:grid-cols-3 lg:items-start">
        <div className="space-y-6 lg:sticky lg:top-6 lg:order-2">
          <Card>
            <CardHeader>
              <CardTitle>Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <StatusBadge
                  status={booking.status}
                  variants={BOOKING_STATUS_VARIANTS}
                  icons={BOOKING_STATUS_ICONS}
                  className="mt-1"
                />
                {canManage && !isTerminal && !isFullyPaid && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => handleStatusChange('cancelled')}>
                      <XCircle /> Cancel booking
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => handleStatusChange('no_show')}>
                      <UserX /> Mark as no-show
                    </Button>
                  </div>
                )}
              </div>

              <Separator />

              <dl className="space-y-3 text-sm">
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-muted-foreground">Scheduled</dt>
                  <dd className="text-right font-medium">{formatDateTime(booking.scheduledAt)}</dd>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-muted-foreground">Client</dt>
                  <dd className="text-right">
                    <p className="font-medium">{booking.Customer?.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {[booking.Customer?.phone, booking.Customer?.email].filter(Boolean).join(' · ') || '—'}
                    </p>
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-muted-foreground">Branch</dt>
                  <dd className="text-right font-medium">{booking.Branch?.name ?? '—'}</dd>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-muted-foreground">Booked by</dt>
                  <dd className="text-right font-medium">
                    {booking.creator ? `${booking.creator.firstName} ${booking.creator.lastName}` : '—'}
                  </dd>
                </div>
              </dl>

              {(booking.vehicleRegistration || booking.vehicleMake || booking.vehicleModel || booking.VehicleType) && (
                <>
                  <Separator />
                  <div>
                    <p className="mb-2 text-sm font-medium">Vehicle</p>
                    <dl className="space-y-2 text-sm">
                      {booking.VehicleType && (
                        <div className="flex items-start justify-between gap-4">
                          <dt className="text-muted-foreground">Type</dt>
                          <dd className="text-right font-medium">{booking.VehicleType.name}</dd>
                        </div>
                      )}
                      {booking.vehicleRegistration && (
                        <div className="flex items-start justify-between gap-4">
                          <dt className="text-muted-foreground">Registration</dt>
                          <dd className="text-right font-medium">{booking.vehicleRegistration}</dd>
                        </div>
                      )}
                      {booking.vehicleMake && (
                        <div className="flex items-start justify-between gap-4">
                          <dt className="text-muted-foreground">Make</dt>
                          <dd className="text-right font-medium">{booking.vehicleMake}</dd>
                        </div>
                      )}
                      {booking.vehicleModel && (
                        <div className="flex items-start justify-between gap-4">
                          <dt className="text-muted-foreground">Model</dt>
                          <dd className="text-right font-medium">{booking.vehicleModel}</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                </>
              )}

              {booking.notes && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground">Notes</p>
                    <p className="mt-1 text-sm">{booking.notes}</p>
                  </div>
                </>
              )}

              <Separator />

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <p className="text-muted-foreground">Total amount</p>
                  <p className="font-medium tabular-nums">
                    {currency} {Number(booking.totalAmount).toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Balance due</p>
                  <p className={cn('text-lg font-semibold tabular-nums', isFullyPaid && 'text-success')}>
                    {currency} {balanceDue.toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {(booking.completedAt || booking.satisfactionRating || booking.customerBehavior || booking.employeeConcerns) && (
            <Card>
              <CardHeader>
                <CardTitle>Service delivery</CardTitle>
                <CardDescription>Details recorded when this booking was completed.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <dl className="space-y-3 text-sm">
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-muted-foreground">Started at</dt>
                    <dd className="text-right font-medium">
                      {booking.startedAt ? formatDateTime(booking.startedAt) : '—'}
                    </dd>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-muted-foreground">Completed at</dt>
                    <dd className="text-right font-medium">
                      {booking.completedAt ? formatDateTime(booking.completedAt) : '—'}
                    </dd>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-muted-foreground">Time taken</dt>
                    <dd className="text-right font-medium">{formatDuration(booking.durationMinutes) ?? '—'}</dd>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-muted-foreground">Client satisfaction</dt>
                    <dd className="text-right font-medium">
                      {SATISFACTION_RATING_OPTIONS.find((opt) => opt.value === String(booking.satisfactionRating))?.label ??
                        '—'}
                    </dd>
                  </div>
                </dl>
                {booking.customerBehavior && (
                  <div>
                    <p className="text-sm text-muted-foreground">Client behaviour</p>
                    <p className="mt-1 text-sm">{booking.customerBehavior}</p>
                  </div>
                )}
                {booking.employeeConcerns && (
                  <div>
                    <p className="text-sm text-muted-foreground">Service provider concerns</p>
                    <p className="mt-1 text-sm">{booking.employeeConcerns}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6 lg:order-1 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Services</CardTitle>
              <CardDescription>Services included in this booking.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {canManage && !isTerminal && (
                <div className="flex gap-2">
                  <Select value={serviceToAdd} onValueChange={setServiceToAdd}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a service to add">
                        {(value) => {
                          const service = availableServices.find((s) => s.id === value);
                          return service
                            ? `${service.name} — ${service.currency} ${Number(service.price).toFixed(2)}`
                            : 'Select a service to add';
                        }}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {availableServices.map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.name} — {service.currency} {Number(service.price).toFixed(2)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="outline" onClick={handleAddService} disabled={!serviceToAdd}>
                    <Plus /> Add
                  </Button>
                </div>
              )}
              <div className="rounded-xl border">
                <DataTable columns={serviceColumns} data={bookingServices} emptyMessage="No services added." />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Staff assignments</CardTitle>
              <CardDescription>Service providers assigned to this booking.</CardDescription>
              {canManage && !isTerminal && (
                <CardAction>
                  <Button variant="outline" size="sm" onClick={() => setAssignDialogOpen(true)}>
                    <UserPlus /> Assign staff
                  </Button>
                </CardAction>
              )}
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border">
                <DataTable columns={assignmentColumns} data={assignments} emptyMessage="No staff assigned yet." />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payments</CardTitle>
              <CardDescription>Payment history for this booking.</CardDescription>
              {canRecordPayment && !isTerminal && !isFullyPaid && (
                <CardAction>
                  <Button variant="outline" size="sm" onClick={() => setPaymentDialogOpen(true)}>
                    <Wallet /> Record payment
                  </Button>
                </CardAction>
              )}
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border">
                <DataTable columns={paymentColumns} data={payments} emptyMessage="No payments recorded yet." />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <AssignStaffDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        bookingId={booking.id}
        branchId={booking.branchId}
        bookingServices={bookingServices}
      />
      <RecordPaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        bookingId={booking.id}
        defaultAmount={balanceDue}
        currency={currency}
      />
    </div>
  );
}
