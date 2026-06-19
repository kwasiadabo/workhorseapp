import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import PageHeader from '@/components/shared/PageHeader';
import DataTable from '@/components/shared/DataTable';
import PaginationBar from '@/components/shared/PaginationBar';
import StatusBadge from '@/components/shared/StatusBadge';
import { formatDateTime } from '@/lib/dateFormat';
import { useBookingsList } from './useBookings';
import {
  ASSIGNMENT_STATUS_ICONS,
  ASSIGNMENT_STATUS_VARIANTS,
  PAYMENT_SUMMARY_ICONS,
  PAYMENT_SUMMARY_VARIANTS,
  buildAssignmentRows,
  formatDuration,
} from './bookings.constants';

const ACTIVE_ASSIGNMENT_STATUSES = ['waiting', 'in_progress'];

export default function MyServicesPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useBookingsList({ page, limit: 20 });

  const rows = buildAssignmentRows(data?.data);

  // Your queue: in-progress work first, then everything else in the order it
  // was assigned to you (first in, first served).
  const queue = rows
    .filter((row) => ACTIVE_ASSIGNMENT_STATUSES.includes(row.status))
    .sort((a, b) => {
      if (a.status !== b.status) return a.status === 'in_progress' ? -1 : 1;
      return new Date(a.assignedAt) - new Date(b.assignedAt);
    })
    .map((row, index) => ({ ...row, position: index + 1 }));

  const history = rows.filter((row) => !ACTIVE_ASSIGNMENT_STATUSES.includes(row.status));

  const queueColumns = [
    { key: 'position', header: '#', className: 'w-10', render: (row) => row.position },
    {
      key: 'scheduledAt',
      header: 'Scheduled',
      render: (row) => formatDateTime(row.scheduledAt),
    },
    { key: 'bookingNumber', header: 'Booking #' },
    { key: 'customer', header: 'Client' },
    { key: 'services', header: 'Service(s)' },
    {
      key: 'durationMinutes',
      header: 'Duration',
      className: 'text-right',
      render: (row) => formatDuration(row.durationMinutes) ?? '—',
    },
    {
      key: 'paymentStatus',
      header: 'Payment',
      render: (row) => (
        <StatusBadge status={row.paymentStatus} variants={PAYMENT_SUMMARY_VARIANTS} icons={PAYMENT_SUMMARY_ICONS} />
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <StatusBadge status={row.status} variants={ASSIGNMENT_STATUS_VARIANTS} icons={ASSIGNMENT_STATUS_ICONS} />
      ),
    },
  ];

  const historyColumns = [
    {
      key: 'scheduledAt',
      header: 'Date',
      render: (row) => formatDateTime(row.scheduledAt),
    },
    { key: 'bookingNumber', header: 'Booking #' },
    { key: 'customer', header: 'Client' },
    { key: 'services', header: 'Service(s)' },
    {
      key: 'durationMinutes',
      header: 'Duration',
      className: 'text-right',
      render: (row) => formatDuration(row.durationMinutes) ?? '—',
    },
    {
      key: 'cost',
      header: 'Cost',
      className: 'text-right',
      render: (row) => `${row.currency} ${row.cost.toFixed(2)}`,
    },
    {
      key: 'paymentStatus',
      header: 'Payment',
      render: (row) => (
        <StatusBadge status={row.paymentStatus} variants={PAYMENT_SUMMARY_VARIANTS} icons={PAYMENT_SUMMARY_ICONS} />
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <StatusBadge status={row.status} variants={ASSIGNMENT_STATUS_VARIANTS} icons={ASSIGNMENT_STATUS_ICONS} />
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <PageHeader title="My Queue" description="Clients waiting for you, in the order you'll see them." />
        <div className="rounded-xl border">
          <DataTable
            columns={queueColumns}
            data={queue}
            isLoading={isLoading}
            isError={isError}
            onRowClick={(row) => navigate(`/app/bookings/${row.bookingId}`)}
            emptyMessage="Your queue is empty."
          />
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Service history</h2>
        <div className="rounded-xl border">
          <DataTable
            columns={historyColumns}
            data={history}
            isLoading={isLoading}
            isError={isError}
            onRowClick={(row) => navigate(`/app/bookings/${row.bookingId}`)}
            emptyMessage="No completed services yet."
          />
          <PaginationBar meta={data?.meta} onPageChange={setPage} />
        </div>
      </div>
    </div>
  );
}
