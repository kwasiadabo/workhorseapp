import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import PageHeader from '@/components/shared/PageHeader';
import DataTable from '@/components/shared/DataTable';
import PaginationBar from '@/components/shared/PaginationBar';
import StatusBadge from '@/components/shared/StatusBadge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDateTime } from '@/lib/dateFormat';
import { useEmployees } from '@/features/employees/useEmployees';
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
const ALL_PROVIDERS = 'all';

export default function QueuesPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [employeeId, setEmployeeId] = useState(ALL_PROVIDERS);
  const [scheduledFrom, setScheduledFrom] = useState('');
  const [scheduledTo, setScheduledTo] = useState('');
  const [queueSearch, setQueueSearch] = useState('');

  const { data: employeesData } = useEmployees({ status: 'active', limit: 100 });
  const employees = employeesData?.data ?? [];

  const { data, isLoading, isError } = useBookingsList({
    page,
    limit: 20,
    employeeId: employeeId === ALL_PROVIDERS ? undefined : employeeId,
    scheduledFrom: scheduledFrom || undefined,
    scheduledTo: scheduledTo || undefined,
  });

  const rows = buildAssignmentRows(data?.data);

  // Active queue: in-progress work first, then everything else in the order
  // it was assigned (first in, first served) — across all service providers.
  const queue = rows
    .filter((row) => ACTIVE_ASSIGNMENT_STATUSES.includes(row.status))
    .sort((a, b) => {
      if (a.status !== b.status) return a.status === 'in_progress' ? -1 : 1;
      return new Date(a.assignedAt) - new Date(b.assignedAt);
    })
    .map((row, index) => ({ ...row, position: index + 1 }));

  const queueSearchTerm = queueSearch.trim().toLowerCase();
  const filteredQueue = queueSearchTerm
    ? queue.filter((row) =>
        [row.bookingNumber, row.customer, row.employeeName, row.services]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(queueSearchTerm)),
      )
    : queue;

  // Completed/cancelled assignments fall out of the active queue and into
  // service history automatically since they're excluded above.
  const history = rows.filter((row) => !ACTIVE_ASSIGNMENT_STATUSES.includes(row.status));

  const handleFilterChange = (setter) => (value) => {
    setter(value);
    setPage(1);
  };

  const queueColumns = [
    { key: 'position', header: '#', className: 'w-10', render: (row) => row.position },
    { key: 'employee', header: 'Service provider', render: (row) => row.employeeName },
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
    { key: 'employee', header: 'Service provider', render: (row) => row.employeeName },
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
      <PageHeader title="Queues" description="Monitor every service provider's queue and service history." />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="space-y-1.5">
          <Label>Service provider</Label>
          <Select value={employeeId} onValueChange={handleFilterChange(setEmployeeId)}>
            <SelectTrigger className="sm:w-56">
              <SelectValue placeholder="All service providers">
                {(value) => {
                  if (value === ALL_PROVIDERS || !value) return 'All service providers';
                  const employee = employees.find((e) => e.id === value);
                  return employee ? `${employee.firstName} ${employee.lastName}` : 'All service providers';
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_PROVIDERS}>All service providers</SelectItem>
              {employees.map((employee) => (
                <SelectItem key={employee.id} value={employee.id}>
                  {employee.firstName} {employee.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="scheduled-from">From</Label>
          <Input
            id="scheduled-from"
            type="date"
            value={scheduledFrom}
            onChange={(event) => handleFilterChange(setScheduledFrom)(event.target.value)}
            className="sm:w-40"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="scheduled-to">To</Label>
          <Input
            id="scheduled-to"
            type="date"
            value={scheduledTo}
            onChange={(event) => handleFilterChange(setScheduledTo)(event.target.value)}
            className="sm:w-40"
          />
        </div>
      </div>

      <div>
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold">Active queue</h2>
          <Input
            placeholder="Search by booking #, client, provider or service..."
            value={queueSearch}
            onChange={(event) => setQueueSearch(event.target.value)}
            className="sm:max-w-xs"
          />
        </div>
        <div className="rounded-xl border">
          <DataTable
            columns={queueColumns}
            data={filteredQueue}
            isLoading={isLoading}
            isError={isError}
            onRowClick={(row) => navigate(`/app/bookings/${row.bookingId}`)}
            emptyMessage={queueSearchTerm ? 'No active assignments match your search.' : 'No active assignments.'}
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
            emptyMessage="No completed services in this range."
          />
          <PaginationBar meta={data?.meta} onPageChange={setPage} />
        </div>
      </div>
    </div>
  );
}
