import { useMemo, useState } from 'react';
import { format, subDays } from 'date-fns';
import { Banknote, CalendarCheck, Users, X } from 'lucide-react';

import PageHeader from '@/components/shared/PageHeader';
import DataTable from '@/components/shared/DataTable';
import DateRangePicker from '@/components/shared/DateRangePicker';
import PaginationBar from '@/components/shared/PaginationBar';
import StatCard from '@/components/shared/StatCard';
import StatusBadge from '@/components/shared/StatusBadge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { formatDate } from '@/lib/dateFormat';
import useDebouncedValue from '@/hooks/useDebouncedValue';
import { useBranches } from '@/features/branches/useBranches';
import { useEmployees } from '@/features/employees/useEmployees';
import {
  ASSIGNMENT_STATUS_VARIANTS,
  ASSIGNMENT_STATUS_ICONS,
  BOOKING_STATUS_VARIANTS,
  BOOKING_STATUS_ICONS,
} from '@/features/bookings/bookings.constants';
import { useServiceProviderPerformance, useServiceProviderAssignments } from './useReports';

const DEFAULT_RANGE = { from: subDays(new Date(), 29), to: new Date() };

const fmt = (n) => `GH¢ ${Number(n ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

const employeeLabel = (e) => `${e.firstName ?? ''} ${e.lastName ?? ''}`.trim();

const PERFORMANCE_COLUMNS = (onSelect) => [
  {
    key: 'name',
    header: 'Service provider',
    render: (row) => (
      <button type="button" className="font-medium text-brand hover:underline" onClick={() => onSelect(row)}>
        {row.name}
      </button>
    ),
  },
  { key: 'branchName', header: 'Branch' },
  { key: 'bookingsCount', header: 'Bookings', className: 'text-right' },
  { key: 'servicesAssigned', header: 'Services assigned', className: 'text-right' },
  { key: 'assignmentsCompleted', header: 'Completed', className: 'text-right' },
  { key: 'revenue', header: 'Revenue', className: 'text-right', render: (row) => fmt(row.revenue) },
  {
    key: 'avgSatisfaction',
    header: 'Avg. satisfaction',
    className: 'text-right',
    render: (row) => (row.avgSatisfaction == null ? '—' : `${row.avgSatisfaction.toFixed(1)} / 5`),
  },
];

const ASSIGNMENT_COLUMNS = [
  { key: 'bookingNumber', header: 'Booking' },
  { key: 'customerName', header: 'Client' },
  { key: 'serviceName', header: 'Service' },
  { key: 'scheduledAt', header: 'Date', render: (row) => formatDate(row.scheduledAt) },
  {
    key: 'assignmentStatus',
    header: 'Assignment status',
    render: (row) => (
      <StatusBadge status={row.assignmentStatus} variants={ASSIGNMENT_STATUS_VARIANTS} icons={ASSIGNMENT_STATUS_ICONS} />
    ),
  },
  {
    key: 'bookingStatus',
    header: 'Booking status',
    render: (row) => <StatusBadge status={row.bookingStatus} variants={BOOKING_STATUS_VARIANTS} icons={BOOKING_STATUS_ICONS} />,
  },
  {
    key: 'amount',
    header: 'Amount',
    className: 'text-right',
    render: (row) => (row.amount == null ? '—' : fmt(row.amount)),
  },
];

export default function ServiceProviderReportPage() {
  const [dateRange, setDateRange] = useState(DEFAULT_RANGE);
  const [branchId, setBranchId] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [page, setPage] = useState(1);
  const [performanceSearch, setPerformanceSearch] = useState('');
  const [assignmentSearch, setAssignmentSearch] = useState('');
  const debouncedAssignmentSearch = useDebouncedValue(assignmentSearch);

  const periodParams = useMemo(
    () => ({
      startDate: format(dateRange.from ?? DEFAULT_RANGE.from, 'yyyy-MM-dd'),
      endDate: format(dateRange.to ?? dateRange.from ?? DEFAULT_RANGE.to, 'yyyy-MM-dd'),
    }),
    [dateRange]
  );

  const performanceParams = useMemo(
    () => ({ ...periodParams, ...(branchId ? { branchId } : {}) }),
    [periodParams, branchId]
  );

  const { data: performance, isLoading: performanceLoading } = useServiceProviderPerformance(performanceParams);
  const { data: branchesData } = useBranches({ limit: 100 });
  const branches = branchesData?.data ?? [];
  const { data: employeesData } = useEmployees({ limit: 100, status: 'active' });
  const employees = employeesData?.data ?? [];
  const employeeOptions = branchId ? employees.filter((e) => e.branchId === branchId) : employees;

  const assignmentParams = useMemo(
    () => ({ ...periodParams, employeeId, page, limit: 20, search: debouncedAssignmentSearch || undefined }),
    [periodParams, employeeId, page, debouncedAssignmentSearch]
  );
  const { data: assignments, isLoading: assignmentsLoading } = useServiceProviderAssignments(assignmentParams, {
    enabled: Boolean(employeeId),
  });

  const summary = performance?.summary ?? {};
  const performanceRows = useMemo(() => performance?.employees ?? [], [performance]);
  const filteredPerformanceRows = useMemo(() => {
    const search = performanceSearch.trim().toLowerCase();
    if (!search) return performanceRows;
    return performanceRows.filter(
      (row) => row.name.toLowerCase().includes(search) || row.branchName.toLowerCase().includes(search)
    );
  }, [performanceRows, performanceSearch]);
  const selectedEmployeeName = employeeId
    ? performanceRows.find((r) => r.employeeId === employeeId)?.name ??
      employeeLabel(employees.find((e) => e.id === employeeId) ?? {})
    : null;

  const handleSelectEmployee = (row) => {
    setEmployeeId(row.employeeId);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Service Provider Report"
        description="Performance per service provider, and the services assigned to each, over a date range."
      />

      <div className="flex flex-wrap items-center gap-3">
        <DateRangePicker value={dateRange} onChange={setDateRange} className="w-64" />

        <Select
          value={branchId}
          onValueChange={(value) => {
            setBranchId(value);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All branches">
              {(value) => (value ? branches.find((b) => b.id === value)?.name ?? 'All branches' : 'All branches')}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All branches</SelectItem>
            {branches.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={employeeId}
          onValueChange={(value) => {
            setEmployeeId(value);
            setPage(1);
            setAssignmentSearch('');
          }}
        >
          <SelectTrigger className="w-52">
            <SelectValue placeholder="All service providers">
              {(value) => {
                if (!value) return 'All service providers';
                const match = employees.find((e) => e.id === value);
                return match ? employeeLabel(match) : 'All service providers';
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All service providers</SelectItem>
            {employeeOptions.map((e) => (
              <SelectItem key={e.id} value={e.id}>
                {employeeLabel(e)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {employeeId && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEmployeeId('');
              setAssignmentSearch('');
            }}
          >
            <X /> Clear
          </Button>
        )}
      </div>

      {!employeeId ? (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard icon={Users} label="Service providers" value={summary.totalServiceProviders ?? 0} isLoading={performanceLoading} />
            <StatCard icon={CalendarCheck} label="Services assigned" value={summary.totalServicesAssigned ?? 0} isLoading={performanceLoading} />
            <StatCard icon={Banknote} label="Revenue from completed work" value={fmt(summary.totalRevenue)} isLoading={performanceLoading} />
          </div>

          <Input
            placeholder="Search by service provider or branch..."
            value={performanceSearch}
            onChange={(e) => setPerformanceSearch(e.target.value)}
            className="sm:max-w-xs"
          />

          <Card className="p-0 overflow-hidden">
            <DataTable
              columns={PERFORMANCE_COLUMNS(handleSelectEmployee)}
              data={filteredPerformanceRows}
              isLoading={performanceLoading}
              emptyMessage="No service provider activity for this period."
            />
          </Card>
        </>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <StatCard icon={CalendarCheck} label="Services assigned" value={assignments?.summary?.count ?? 0} isLoading={assignmentsLoading} />
            <StatCard icon={Banknote} label="Total amount" value={fmt(assignments?.summary?.totalAmount)} isLoading={assignmentsLoading} />
          </div>

          <Input
            placeholder="Search by booking number, client or service..."
            value={assignmentSearch}
            onChange={(e) => {
              setAssignmentSearch(e.target.value);
              setPage(1);
            }}
            className="sm:max-w-xs"
          />

          <Card className="p-0 overflow-hidden">
            <div className="border-b p-4">
              <h3 className="font-semibold">{selectedEmployeeName}</h3>
              <p className="text-sm text-muted-foreground">Services assigned in the selected period.</p>
            </div>
            <DataTable
              columns={ASSIGNMENT_COLUMNS}
              data={assignments?.items}
              isLoading={assignmentsLoading}
              emptyMessage="No services assigned to this provider in this period."
            />
            <PaginationBar meta={assignments?.meta} onPageChange={setPage} />
          </Card>
        </>
      )}
    </div>
  );
}
