import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { CheckCircle2, Clock, Download, Printer, RotateCcw, XCircle } from 'lucide-react';
import { toast } from 'sonner';

import PageHeader from '@/components/shared/PageHeader';
import DataTable from '@/components/shared/DataTable';
import PaginationBar from '@/components/shared/PaginationBar';
import StatusBadge from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import useDebouncedValue from '@/hooks/useDebouncedValue';
import { useEmployees } from '@/features/employees/useEmployees';
import { downloadCsv, fetchAllPages, printTable } from '@/lib/exportTable';
import { formatDateTime } from '@/lib/dateFormat';
import { usePayments } from './usePayments';
import { paymentsApi } from './payments.api';

const PAYMENT_STATUS_VARIANTS = {
  pending: 'warning',
  completed: 'success',
  failed: 'destructive',
  refunded: 'info',
};

const PAYMENT_STATUS_ICONS = {
  pending: Clock,
  completed: CheckCircle2,
  failed: XCircle,
  refunded: RotateCcw,
};

const providerName = (row) => {
  const employee = row.receiver?.Employee;
  if (employee) return `${employee.firstName} ${employee.lastName}`;
  if (row.receiver) return `${row.receiver.firstName} ${row.receiver.lastName}`;
  return '—';
};

const EXPORT_COLUMNS = [
  { header: 'Paid at', value: (row) => formatDateTime(row.paidAt) },
  { header: 'Reference', value: (row) => row.referenceNumber || '' },
  { header: 'Booking #', value: (row) => row.Booking?.bookingNumber || '' },
  { header: 'Customer', value: (row) => row.Booking?.Customer?.name || '' },
  { header: 'Service provider', value: providerName },
  { header: 'Method', value: (row) => row.method?.replace('_', ' ') },
  { header: 'Status', value: (row) => row.status },
  { header: 'Amount', value: (row) => Number(row.amount).toFixed(2) },
  { header: 'Currency', value: (row) => row.currency },
];

export default function PaymentsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [employeeFilter, setEmployeeFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const debouncedSearch = useDebouncedValue(search);

  const { data: employeesData } = useEmployees({ limit: 100, status: 'active' });
  const employees = employeesData?.data ?? [];

  const filters = {
    search: debouncedSearch || undefined,
    employeeId: employeeFilter === 'all' ? undefined : employeeFilter,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  };

  const { data, isLoading, isError } = usePayments({ page, limit: 20, ...filters });
  const totals = data?.meta?.totals;

  const columns = [
    { key: 'paidAt', header: 'Paid at', render: (row) => formatDateTime(row.paidAt) },
    { key: 'referenceNumber', header: 'Reference', render: (row) => row.referenceNumber || '—' },
    { key: 'bookingNumber', header: 'Booking #', render: (row) => row.Booking?.bookingNumber || '—' },
    { key: 'customer', header: 'Customer', render: (row) => row.Booking?.Customer?.name || '—' },
    { key: 'provider', header: 'Service provider', render: providerName },
    { key: 'amount', header: 'Amount', render: (row) => `${row.currency} ${Number(row.amount).toFixed(2)}` },
    { key: 'method', header: 'Method', className: 'capitalize', render: (row) => row.method?.replace('_', ' ') },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <StatusBadge status={row.status} variants={PAYMENT_STATUS_VARIANTS} icons={PAYMENT_STATUS_ICONS} />
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (row) => (
        <Button variant="ghost" size="sm" onClick={() => navigate(`/app/bookings/${row.bookingId}`)}>
          View booking
        </Button>
      ),
    },
  ];

  const buildSubtitle = () => {
    const range = startDate || endDate ? `${startDate || '…'} – ${endDate || '…'}` : 'All time';
    const provider = employeeFilter === 'all' ? 'All providers' : (employees.find((e) => e.id === employeeFilter)?.firstName ?? '');
    return `Period: ${range}${provider ? ` · Provider: ${provider} ${employees.find((e) => e.id === employeeFilter)?.lastName ?? ''}` : ''}`;
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const rows = await fetchAllPages(paymentsApi.list, filters);
      downloadCsv(`payments-${format(new Date(), 'yyyyMMdd-HHmm')}.csv`, EXPORT_COLUMNS, rows);
    } catch {
      toast.error('Unable to export payments');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = async () => {
    setIsExporting(true);
    try {
      const rows = await fetchAllPages(paymentsApi.list, filters);
      const printTotals = EXPORT_COLUMNS.map((col) => {
        if (col.header === 'Paid at') return `Total (${rows.length})`;
        if (col.header === 'Amount') return Number(totals?.totalAmount ?? 0).toFixed(2);
        return '';
      });
      printTable({ title: 'Payments', subtitle: buildSubtitle(), columns: EXPORT_COLUMNS, rows, totals: printTotals });
    } catch {
      toast.error('Unable to prepare print view');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Payments"
        description="Payment history across your business."
        actions={
          <>
            <Button variant="outline" onClick={handleExport} disabled={isExporting}>
              <Download /> Export CSV
            </Button>
            <Button variant="outline" onClick={handlePrint} disabled={isExporting}>
              <Printer /> Print
            </Button>
          </>
        }
      />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <Input
          placeholder="Search by reference, customer, booking #..."
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
          <SelectTrigger className="sm:w-56">
            <SelectValue placeholder="Service provider">
              {(value) =>
                value === 'all' || !value
                  ? 'All service providers'
                  : (() => {
                      const employee = employees.find((e) => e.id === value);
                      return employee ? `${employee.firstName} ${employee.lastName}` : 'Service provider';
                    })()
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All service providers</SelectItem>
            {employees.map((employee) => (
              <SelectItem key={employee.id} value={employee.id}>
                {employee.firstName} {employee.lastName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground" htmlFor="payments-start-date">
            From
          </label>
          <Input
            id="payments-start-date"
            type="date"
            value={startDate}
            max={endDate || undefined}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPage(1);
            }}
            className="w-auto"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground" htmlFor="payments-end-date">
            To
          </label>
          <Input
            id="payments-end-date"
            type="date"
            value={endDate}
            min={startDate || undefined}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPage(1);
            }}
            className="w-auto"
          />
        </div>
      </div>
      <div className="rounded-xl border">
        <DataTable columns={columns} data={data?.data} isLoading={isLoading} isError={isError} emptyMessage="No payments recorded yet." />
        {totals && (
          <div className="flex items-center justify-between border-t px-4 py-3 text-sm">
            <span className="text-muted-foreground">
              {totals.count} payment{totals.count === 1 ? '' : 's'}
            </span>
            <span className="font-medium">Total: GH¢ {totals.totalAmount.toFixed(2)}</span>
          </div>
        )}
        <PaginationBar meta={data?.meta} onPageChange={setPage} />
      </div>
    </div>
  );
}
