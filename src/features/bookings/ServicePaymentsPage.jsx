import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import PageHeader from '@/components/shared/PageHeader';
import DataTable from '@/components/shared/DataTable';
import PaginationBar from '@/components/shared/PaginationBar';
import StatusBadge from '@/components/shared/StatusBadge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDateTime } from '@/lib/dateFormat';
import useDebouncedValue from '@/hooks/useDebouncedValue';
import { useEmployees } from '@/features/employees/useEmployees';
import { useBookingsList } from './useBookings';
import { BOOKING_STATUS_ICONS, BOOKING_STATUS_VARIANTS, getBookingPaymentSummary } from './bookings.constants';

export default function ServicePaymentsPage() {
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [employeeFilter, setEmployeeFilter] = useState('all');
  const debouncedSearch = useDebouncedValue(search);

  const { data: employeesData } = useEmployees({ limit: 100 });
  const employees = employeesData?.data ?? [];
  const employeeName = (employee) => `${employee.firstName} ${employee.lastName}`;

  const { data, isLoading, isError } = useBookingsList({
    page,
    limit: 20,
    unpaidOnly: true,
    employeeId: employeeFilter === 'all' ? undefined : employeeFilter,
    search: debouncedSearch || undefined,
  });

  const columns = [
    { key: 'bookingNumber', header: 'Booking #' },
    { key: 'customer', header: 'Client', render: (row) => row.Customer?.name ?? '—' },
    {
      key: 'services',
      header: 'Services',
      render: (row) => (row.bookingServices ?? []).map((bs) => bs.Service?.name ?? 'Unknown service').join(', ') || '—',
    },
    {
      key: 'serviceProviders',
      header: 'Service provider(s)',
      render: (row) => {
        const names = (row.assignments ?? [])
          .map((a) => `${a.Employee?.firstName ?? ''} ${a.Employee?.lastName ?? ''}`.trim())
          .filter(Boolean);
        return names.length ? names.join(', ') : '—';
      },
    },
    {
      key: 'scheduledAt',
      header: 'Scheduled',
      render: (row) => formatDateTime(row.scheduledAt),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} variants={BOOKING_STATUS_VARIANTS} icons={BOOKING_STATUS_ICONS} />,
    },
    {
      key: 'balanceDue',
      header: 'Amount',
      className: 'text-right',
      render: (row) => {
        const { balanceDue } = getBookingPaymentSummary(row);
        const currency = row.bookingServices?.[0]?.Service?.currency ?? 'GH¢';
        return `${currency} ${balanceDue.toFixed(2)}`;
      },
    },
  ];

  return (
    <div>
      <PageHeader title="Service Payments" description="Bookings yet to be paid." />
      <div className="overflow-hidden rounded-xl border">
        <div className="flex flex-col gap-3 border-b p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              placeholder="Search by booking # or client..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="sm:max-w-xs"
            />
            <Select
              value={employeeFilter}
              onValueChange={(value) => {
                setEmployeeFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="sm:w-52">
                <SelectValue placeholder="Service provider">
                  {(value) => {
                    if (value === 'all' || !value) return 'All service providers';
                    const employee = employees.find((e) => e.id === value);
                    return employee ? employeeName(employee) : 'Service provider';
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All service providers</SelectItem>
                {employees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employeeName(employee)}
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
          emptyMessage="No unpaid services — everything is settled."
        />
        <PaginationBar meta={data?.meta} onPageChange={setPage} />
      </div>
    </div>
  );
}
