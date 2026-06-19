import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';

import PageHeader from '@/components/shared/PageHeader';
import DataTable from '@/components/shared/DataTable';
import PaginationBar from '@/components/shared/PaginationBar';
import StatusBadge from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDateTime } from '@/lib/dateFormat';
import useAuthStore from '@/store/authStore';
import { useBranches } from '@/features/branches/useBranches';
import { useBookingsList } from './useBookings';
import {
  BOOKING_STATUSES,
  BOOKING_STATUS_ICONS,
  BOOKING_STATUS_VARIANTS,
  PAYMENT_SUMMARY_ICONS,
  PAYMENT_SUMMARY_VARIANTS,
  TERMINAL_BOOKING_STATUSES,
  getBookingPaymentSummary,
} from './bookings.constants';
import UpdateBookingStatusDialog from './UpdateBookingStatusDialog';

export default function BookingsListPage() {
  const navigate = useNavigate();
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const canCreate = hasPermission('bookings.create');
  const canViewAll = hasPermission('bookings.view');
  const canManage = hasPermission('bookings.manage');

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [branchFilter, setBranchFilter] = useState('all');
  const [statusBooking, setStatusBooking] = useState(null);

  const { data: branchesData } = useBranches({ limit: 100 });
  const branches = branchesData?.data ?? [];

  const { data, isLoading, isError } = useBookingsList({
    page,
    limit: 20,
    status: statusFilter === 'all' ? undefined : statusFilter,
    branchId: branchFilter === 'all' ? undefined : branchFilter,
  });

  const columns = [
    { key: 'bookingNumber', header: 'Booking #' },
    { key: 'customer', header: 'Client', render: (row) => row.Customer?.name ?? '—' },
    { key: 'branch', header: 'Branch', render: (row) => row.Branch?.name ?? '—' },
    {
      key: 'scheduledAt',
      header: 'Scheduled',
      render: (row) => formatDateTime(row.scheduledAt),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <StatusBadge status={row.status} variants={BOOKING_STATUS_VARIANTS} icons={BOOKING_STATUS_ICONS} />
      ),
    },
    {
      key: 'totalAmount',
      header: 'Total',
      className: 'text-right',
      render: (row) => Number(row.totalAmount).toFixed(2),
    },
    {
      key: 'paymentStatus',
      header: 'Payment',
      render: (row) => {
        const { paymentStatus } = getBookingPaymentSummary(row);
        return <StatusBadge status={paymentStatus} variants={PAYMENT_SUMMARY_VARIANTS} icons={PAYMENT_SUMMARY_ICONS} />;
      },
    },
    ...(canManage
      ? [
          {
            key: 'actions',
            header: '',
            className: 'text-right',
            render: (row) =>
              !TERMINAL_BOOKING_STATUSES.includes(row.status) &&
              !getBookingPaymentSummary(row).isFullyPaid && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(event) => {
                    event.stopPropagation();
                    setStatusBooking(row);
                  }}
                >
                  Cancel / no-show
                </Button>
              ),
          },
        ]
      : []),
  ];

  return (
    <div>
      <PageHeader
        title="Bookings"
        description={canViewAll ? 'All bookings across your business.' : 'Bookings assigned to you.'}
        actions={
          canCreate && (
            <Button onClick={() => navigate('/app/bookings/new')} variant="brand">
              <Plus /> New booking
            </Button>
          )
        }
      />
      <div className="overflow-hidden rounded-xl border">
        <div className="flex flex-col gap-3 border-b p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="sm:w-44">
                <SelectValue placeholder="Status">
                  {(value) => (value === 'all' || !value ? 'All statuses' : value.replace('_', ' '))}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {BOOKING_STATUSES.map((opt) => (
                  <SelectItem key={opt} value={opt} className="capitalize">
                    {opt.replace('_', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={branchFilter}
              onValueChange={(value) => {
                setBranchFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="sm:w-48">
                <SelectValue placeholder="Branch">
                  {(value) =>
                    value === 'all' || !value ? 'All branches' : (branches.find((branch) => branch.id === value)?.name ?? 'Branch')
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All branches</SelectItem>
                {branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {typeof data?.meta?.total === 'number' && (
            <p className="text-sm text-muted-foreground">
              {data.meta.total} booking{data.meta.total === 1 ? '' : 's'}
            </p>
          )}
        </div>
        <DataTable
          columns={columns}
          data={data?.data}
          isLoading={isLoading}
          isError={isError}
          onRowClick={(row) => navigate(`/app/bookings/${row.id}`)}
          emptyMessage="No bookings found."
        />
        <PaginationBar meta={data?.meta} onPageChange={setPage} />
      </div>
      <UpdateBookingStatusDialog
        open={Boolean(statusBooking)}
        onOpenChange={(open) => !open && setStatusBooking(null)}
        booking={statusBooking}
      />
    </div>
  );
}
