import { useState } from 'react';
import { format } from 'date-fns';
import { Download, Plus, Printer } from 'lucide-react';
import { toast } from 'sonner';

import PageHeader from '@/components/shared/PageHeader';
import DataTable from '@/components/shared/DataTable';
import PaginationBar from '@/components/shared/PaginationBar';
import StatusBadge from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import useAuthStore from '@/store/authStore';
import useDebouncedValue from '@/hooks/useDebouncedValue';
import { useBranches } from '@/features/branches/useBranches';
import { downloadCsv, fetchAllPages, printTable } from '@/lib/exportTable';
import { formatDate } from '@/lib/dateFormat';
import { useCashHandovers } from './useCashHandovers';
import { cashHandoversApi } from './cashHandovers.api';
import { CASH_HANDOVER_STATUS_ICONS, CASH_HANDOVER_STATUS_VARIANTS, CASH_HANDOVER_STATUSES } from './cashHandovers.constants';
import NewHandoverDialog from './NewHandoverDialog';
import ReviewHandoverDialog from './ReviewHandoverDialog';

const periodLabel = (row) => `${formatDate(row.periodStart)} – ${formatDate(row.periodEnd)}`;
const employeeLabel = (row) => `${row.Employee?.firstName ?? ''} ${row.Employee?.lastName ?? ''}`.trim() || '—';

export default function CashHandoversPage() {
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const canManage = hasPermission('cash_handovers.manage');
  const canViewAll = canManage || hasPermission('cash_handovers.view');

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [branchFilter, setBranchFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [reviewHandover, setReviewHandover] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const debouncedSearch = useDebouncedValue(search);

  const { data: branchesData } = useBranches({ limit: 100 }, { enabled: canViewAll });
  const branches = branchesData?.data ?? [];

  const filters = {
    search: debouncedSearch || undefined,
    status: statusFilter === 'all' ? undefined : statusFilter,
    branchId: branchFilter === 'all' ? undefined : branchFilter,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  };

  const { data, isLoading, isError } = useCashHandovers({ page, limit: 20, ...filters });
  const totals = data?.meta?.totals;

  const EXPORT_COLUMNS = [
    { header: 'Period start', value: (row) => formatDate(row.periodStart) },
    { header: 'Period end', value: (row) => formatDate(row.periodEnd) },
    ...(canViewAll ? [{ header: 'Employee', value: employeeLabel }] : []),
    { header: 'Branch', value: (row) => row.Branch?.name ?? '' },
    { header: 'Expected', value: (row) => Number(row.expectedAmount).toFixed(2) },
    { header: 'Declared', value: (row) => Number(row.declaredAmount).toFixed(2) },
    { header: 'Variance', value: (row) => Number(row.variance).toFixed(2) },
    { header: 'Status', value: (row) => row.status },
    { header: 'Submitted', value: (row) => formatDate(row.submittedAt) },
  ];

  const columns = [
    { key: 'period', header: 'Period', render: periodLabel },
    ...(canViewAll ? [{ key: 'employee', header: 'Employee', render: employeeLabel }] : []),
    { key: 'branch', header: 'Branch', render: (row) => row.Branch?.name ?? '—' },
    {
      key: 'expectedAmount',
      header: 'Expected',
      className: 'text-right',
      render: (row) => `${row.currency} ${Number(row.expectedAmount).toFixed(2)}`,
    },
    {
      key: 'declaredAmount',
      header: 'Declared',
      className: 'text-right',
      render: (row) => `${row.currency} ${Number(row.declaredAmount).toFixed(2)}`,
    },
    {
      key: 'variance',
      header: 'Variance',
      className: 'text-right',
      render: (row) => {
        const variance = Number(row.variance);
        return (
          <span className={variance < 0 ? 'text-destructive' : variance > 0 ? 'text-emerald-600' : ''}>
            {row.currency} {variance.toFixed(2)}
          </span>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <StatusBadge status={row.status} variants={CASH_HANDOVER_STATUS_VARIANTS} icons={CASH_HANDOVER_STATUS_ICONS} />
      ),
    },
    {
      key: 'submittedAt',
      header: 'Submitted',
      render: (row) => formatDate(row.submittedAt),
    },
    ...(canManage
      ? [
          {
            key: 'actions',
            header: '',
            className: 'text-right',
            render: (row) =>
              row.status === 'submitted' && (
                <Button variant="outline" size="sm" onClick={() => setReviewHandover(row)}>
                  Review
                </Button>
              ),
          },
        ]
      : []),
  ];

  const buildSubtitle = () => {
    const range = startDate || endDate ? `${startDate || '…'} – ${endDate || '…'}` : 'All time';
    const status = statusFilter === 'all' ? 'All statuses' : statusFilter.replace('_', ' ');
    return `Period: ${range} · Status: ${status}`;
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const rows = await fetchAllPages(cashHandoversApi.list, filters);
      downloadCsv(`cash-handovers-${format(new Date(), 'yyyyMMdd-HHmm')}.csv`, EXPORT_COLUMNS, rows);
    } catch {
      toast.error('Unable to export cash handovers');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = async () => {
    setIsExporting(true);
    try {
      const rows = await fetchAllPages(cashHandoversApi.list, filters);
      const printTotals = EXPORT_COLUMNS.map((col) => {
        if (col.header === 'Period start') return `Total (${rows.length})`;
        if (col.header === 'Expected') return Number(totals?.totalExpected ?? 0).toFixed(2);
        if (col.header === 'Declared') return Number(totals?.totalDeclared ?? 0).toFixed(2);
        if (col.header === 'Variance') return Number(totals?.totalVariance ?? 0).toFixed(2);
        return '';
      });
      printTable({ title: 'Cash Handovers', subtitle: buildSubtitle(), columns: EXPORT_COLUMNS, rows, totals: printTotals });
    } catch {
      toast.error('Unable to prepare print view');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Cash Handovers"
        description={canViewAll ? 'Cash declared by team leads across your business.' : 'Cash you have declared for handover.'}
        actions={
          <>
            <Button variant="outline" onClick={handleExport} disabled={isExporting}>
              <Download /> Export CSV
            </Button>
            <Button variant="outline" onClick={handlePrint} disabled={isExporting}>
              <Printer /> Print
            </Button>
            <Button onClick={() => setCreateOpen(true)} variant="brand">
              <Plus /> New handover
            </Button>
          </>
        }
      />
      <div className="overflow-hidden rounded-xl border">
        <div className="flex flex-col gap-3 border-b p-3 sm:flex-row sm:items-end sm:flex-wrap">
          <Input
            placeholder="Search by employee, branch, notes..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="sm:max-w-xs"
          />
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
              {CASH_HANDOVER_STATUSES.map((opt) => (
                <SelectItem key={opt} value={opt} className="capitalize">
                  {opt.replace('_', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {canViewAll && (
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
          )}
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground" htmlFor="handovers-start-date">
              From
            </label>
            <Input
              id="handovers-start-date"
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
            <label className="text-sm text-muted-foreground" htmlFor="handovers-end-date">
              To
            </label>
            <Input
              id="handovers-end-date"
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
        <DataTable
          columns={columns}
          data={data?.data}
          isLoading={isLoading}
          isError={isError}
          emptyMessage="No cash handovers recorded yet."
        />
        {totals && (
          <div className="flex flex-col gap-1 border-t px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
            <span className="text-muted-foreground">
              {totals.count} handover{totals.count === 1 ? '' : 's'}
            </span>
            <div className="flex gap-4">
              <span>Expected: GH¢ {totals.totalExpected.toFixed(2)}</span>
              <span>Declared: GH¢ {totals.totalDeclared.toFixed(2)}</span>
              <span className={totals.totalVariance < 0 ? 'text-destructive' : totals.totalVariance > 0 ? 'text-emerald-600' : ''}>
                Variance: GH¢ {totals.totalVariance.toFixed(2)}
              </span>
            </div>
          </div>
        )}
        <PaginationBar meta={data?.meta} onPageChange={setPage} />
      </div>
      <NewHandoverDialog open={createOpen} onOpenChange={setCreateOpen} />
      <ReviewHandoverDialog
        open={Boolean(reviewHandover)}
        onOpenChange={(open) => !open && setReviewHandover(null)}
        handover={reviewHandover}
      />
    </div>
  );
}
