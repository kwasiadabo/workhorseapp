import { useMemo, useState } from 'react';
import { format, subDays } from 'date-fns';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Banknote,
  Building2,
  CalendarCheck,
  CheckCircle2,
  Download,
  Landmark,
  RefreshCw,
  Scale,
  TrendingUp,
  UserPlus,
  UserRound,
  Users,
  Wallet,
} from 'lucide-react';

import PageHeader from '@/components/shared/PageHeader';
import DataTable from '@/components/shared/DataTable';
import DateRangePicker from '@/components/shared/DateRangePicker';
import StatCard from '@/components/shared/StatCard';
import { Button } from '@/components/ui/button';
import { Card, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/dateFormat';
import { downloadCsv } from '@/lib/exportTable';
import { formatDuration } from '@/features/bookings/bookings.constants';
import { useBranches } from '@/features/branches/useBranches';
import { useBankingReport } from '@/features/banking/useBankingReport';
import { useReportsOverview } from './useReports';

const DEFAULT_RANGE = { from: subDays(new Date(), 29), to: new Date() };

const BOOKING_STATUS_COLORS = {
  confirmed: 'var(--color-chart-2)',
  in_progress: 'var(--color-info)',
  awaiting_payment: 'var(--color-chart-1)',
  completed: 'var(--color-success)',
  cancelled: 'var(--color-chart-3)',
  no_show: 'var(--color-destructive)',
};

const formatMoney = (amount) => `GH¢ ${Number(amount ?? 0).toFixed(2)}`;

const formatLabel = (value = '') =>
  value
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const formatRating = (rating) => (rating == null ? '—' : `${rating.toFixed(1)} / 5`);

const exportFilename = (slug) => `${slug}-${format(new Date(), 'yyyyMMdd-HHmm')}.csv`;

function ChartCard({ title, isEmpty, emptyMessage, children }) {
  return (
    <Card className="gap-3 p-5">
      <CardTitle>{title}</CardTitle>
      <div className="h-64">
        {isEmpty ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">{emptyMessage}</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {children}
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}

function TableCard({ title, columns, data, emptyMessage, onExport }) {
  return (
    <Card className="gap-3 p-5">
      <div className="flex items-center justify-between">
        <CardTitle>{title}</CardTitle>
        {data.length > 0 && (
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download className="size-4" /> Export
          </Button>
        )}
      </div>
      <DataTable columns={columns} data={data} emptyMessage={emptyMessage} />
    </Card>
  );
}

export default function BusinessAnalyticsPage() {
  const [dateRange, setDateRange] = useState(DEFAULT_RANGE);
  const [branchFilter, setBranchFilter] = useState('all');

  const { data: branchesData } = useBranches({ limit: 100 });
  const branches = branchesData?.data ?? [];

  const params = useMemo(() => ({
    startDate: format(dateRange.from ?? DEFAULT_RANGE.from, 'yyyy-MM-dd'),
    endDate: format(dateRange.to ?? dateRange.from ?? DEFAULT_RANGE.to, 'yyyy-MM-dd'),
    branchId: branchFilter === 'all' ? undefined : branchFilter,
  }), [dateRange, branchFilter]);

  const { data, isLoading } = useReportsOverview(params);
  const { data: bankingData } = useBankingReport({ startDate: params.startDate, endDate: params.endDate });

  const revenueTrendData = (data?.revenueTrend ?? []).map((row) => {
    const [year, month] = row.month.split('-').map(Number);
    return { ...row, label: format(new Date(year, month - 1, 1), 'MMM yyyy') };
  });
  const hasRevenueTrend = revenueTrendData.some((row) => row.count > 0);

  const bookingsByStatusData = data?.bookingsByStatus ?? [];
  const hasBookingsByStatus = bookingsByStatusData.some((row) => row.count > 0);

  const branchPerformance = data?.branchPerformance ?? [];
  const employeePerformance = data?.employeePerformance ?? [];
  const topServices = data?.topServices ?? [];
  const topCustomers = data?.topCustomers ?? [];
  const expensesByCategory = data?.expensesByCategory ?? [];
  const hasExpensesByCategory = expensesByCategory.some((row) => row.total > 0);

  const periodLabel = data ? `${formatDate(data.period.startDate)} – ${formatDate(data.period.endDate)}` : 'Performance overview across your business.';

  return (
    <div className="space-y-8">
      <PageHeader
        title="Business Analytics"
        description={periodLabel}
        actions={
          <div className="flex flex-wrap gap-2">
            <Select value={branchFilter} onValueChange={setBranchFilter}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Branch">
                  {(value) => (value === 'all' ? 'All branches' : branches.find((b) => b.id === value)?.name ?? 'Branch')}
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
            <DateRangePicker value={dateRange} onChange={setDateRange} className="w-64" />
          </div>
        }
      />

      {isLoading || !data ? (
        <div className="space-y-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-72" />
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard label="Total revenue" value={formatMoney(data.summary.totalRevenue)} icon={Wallet} />
            <StatCard label="Total expenses" value={formatMoney(data.summary.totalExpenses)} icon={Banknote} />
            <StatCard label="Net income" value={formatMoney(data.summary.netIncome)} icon={Scale} />
            <StatCard label="Total bookings" value={data.summary.totalBookings} icon={CalendarCheck} />
            <StatCard label="Completed bookings" value={data.summary.completedBookings} icon={CheckCircle2} />
            <StatCard label="Avg. booking value" value={formatMoney(data.summary.avgBookingValue)} icon={TrendingUp} />
            <StatCard label="New customers" value={data.summary.newCustomers} icon={UserPlus} />
            <StatCard label="Returning customers" value={data.summary.returningCustomers} icon={RefreshCw} />
            <StatCard label="Total customers" value={data.summary.totalCustomers} icon={UserRound} />
            <StatCard label="Active service providers" value={data.summary.activeEmployees} icon={Users} />
            <StatCard label="Branches" value={data.summary.totalBranches} icon={Building2} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="Revenue trend (last 6 months)" isEmpty={!hasRevenueTrend} emptyMessage="No payments recorded yet.">
              <BarChart data={revenueTrendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip formatter={(value, _name, item) => [`${formatMoney(value)} (${item.payload.count})`, 'Revenue']} />
                <Bar dataKey="totalAmount" fill="var(--color-brand)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartCard>

            <ChartCard title="Bookings by status" isEmpty={!hasBookingsByStatus} emptyMessage="No bookings in this period.">
              <PieChart>
                <Pie data={bookingsByStatusData} dataKey="count" nameKey="status" innerRadius={50} outerRadius={80} paddingAngle={2}>
                  {bookingsByStatusData.map((entry) => (
                    <Cell key={entry.status} fill={BOOKING_STATUS_COLORS[entry.status]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [value, formatLabel(name)]} />
              </PieChart>
            </ChartCard>

            <ChartCard title="Revenue by branch" isEmpty={branchPerformance.length === 0} emptyMessage="No branches found.">
              <BarChart data={branchPerformance}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="branchName" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip formatter={(value) => formatMoney(value)} />
                <Bar dataKey="revenue" fill="var(--color-chart-2)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartCard>
          </div>

          <ChartCard title="Top services by revenue" isEmpty={topServices.length === 0} emptyMessage="No services recorded in this period.">
            <BarChart data={topServices} layout="vertical" margin={{ left: 24 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={140} />
              <Tooltip formatter={(value) => formatMoney(value)} />
              <Bar dataKey="revenue" fill="var(--color-brand)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ChartCard>

          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="Bookings by hour of day" isEmpty={!data.busiestHours?.some((h) => h.count > 0)} emptyMessage="No bookings in this period.">
              <BarChart data={data.busiestHours ?? []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={2} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip formatter={(value) => [value, 'Bookings']} />
                <Bar dataKey="count" fill="var(--color-chart-2)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ChartCard>

            <ChartCard title="Bookings by day of week" isEmpty={!data.busiestDays?.some((d) => d.count > 0)} emptyMessage="No bookings in this period.">
              <BarChart data={data.busiestDays ?? []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip formatter={(value) => [value, 'Bookings']} />
                <Bar dataKey="count" fill="var(--color-chart-1)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ChartCard>
          </div>

          <ChartCard title="Expenses by category" isEmpty={!hasExpensesByCategory} emptyMessage="No expenses recorded in this period.">
            <BarChart data={expensesByCategory.slice(0, 8)} layout="vertical" margin={{ left: 24 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
              <YAxis type="category" dataKey="categoryName" tick={{ fontSize: 12 }} width={120} />
              <Tooltip formatter={(value) => formatMoney(value)} />
              <Bar dataKey="total" fill="var(--color-destructive)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ChartCard>

          <TableCard
            title="Branch performance"
            data={branchPerformance}
            emptyMessage="No branches found."
            onExport={() =>
              downloadCsv(
                exportFilename('branch-performance'),
                [
                  { header: 'Branch', value: (row) => row.branchName },
                  { header: 'Bookings', value: (row) => row.bookingsCount },
                  { header: 'Completed', value: (row) => row.completedCount },
                  { header: 'Revenue', value: (row) => row.revenue.toFixed(2) },
                  { header: 'Avg. satisfaction', value: (row) => (row.avgSatisfaction == null ? '' : row.avgSatisfaction) },
                  { header: 'Service providers', value: (row) => row.employeeCount },
                ],
                branchPerformance
              )
            }
            columns={[
              { key: 'branchName', header: 'Branch' },
              { key: 'bookingsCount', header: 'Bookings', className: 'text-right' },
              { key: 'completedCount', header: 'Completed', className: 'text-right' },
              { key: 'revenue', header: 'Revenue', className: 'text-right', render: (row) => formatMoney(row.revenue) },
              { key: 'avgSatisfaction', header: 'Avg. satisfaction', className: 'text-right', render: (row) => formatRating(row.avgSatisfaction) },
              { key: 'employeeCount', header: 'Service providers', className: 'text-right' },
            ]}
          />

          <TableCard
            title="Service provider performance"
            data={employeePerformance}
            emptyMessage="No service providers had assignments in this period."
            onExport={() =>
              downloadCsv(
                exportFilename('service-provider-performance'),
                [
                  { header: 'Service provider', value: (row) => row.name },
                  { header: 'Branch', value: (row) => row.branchName },
                  { header: 'Services assigned', value: (row) => row.servicesAssigned },
                  { header: 'Bookings', value: (row) => row.bookingsCount },
                  { header: 'Completed assignments', value: (row) => row.assignmentsCompleted },
                  { header: 'Revenue', value: (row) => row.revenue.toFixed(2) },
                  { header: 'Avg. satisfaction', value: (row) => (row.avgSatisfaction == null ? '' : row.avgSatisfaction) },
                  { header: 'Avg. duration (min)', value: (row) => (row.avgDurationMinutes == null ? '' : row.avgDurationMinutes) },
                ],
                employeePerformance
              )
            }
            columns={[
              { key: 'name', header: 'Service provider' },
              { key: 'branchName', header: 'Branch' },
              { key: 'servicesAssigned', header: 'Services assigned', className: 'text-right' },
              { key: 'bookingsCount', header: 'Bookings', className: 'text-right' },
              { key: 'assignmentsCompleted', header: 'Completed', className: 'text-right' },
              { key: 'revenue', header: 'Revenue', className: 'text-right', render: (row) => formatMoney(row.revenue) },
              { key: 'avgSatisfaction', header: 'Avg. satisfaction', className: 'text-right', render: (row) => formatRating(row.avgSatisfaction) },
              {
                key: 'avgDurationMinutes',
                header: 'Avg. duration',
                className: 'text-right',
                render: (row) => (row.avgDurationMinutes == null ? '—' : formatDuration(row.avgDurationMinutes)),
              },
            ]}
          />

          <TableCard
            title="Top customers"
            data={topCustomers}
            emptyMessage="No customers had bookings in this period."
            onExport={() =>
              downloadCsv(
                exportFilename('top-customers'),
                [
                  { header: 'Customer', value: (row) => row.name },
                  { header: 'Phone', value: (row) => row.phone ?? '' },
                  { header: 'Bookings', value: (row) => row.bookingsCount },
                  { header: 'Total spent', value: (row) => row.totalSpent.toFixed(2) },
                  { header: 'Last visit', value: (row) => formatDate(row.lastVisit) },
                ],
                topCustomers
              )
            }
            columns={[
              { key: 'name', header: 'Customer' },
              { key: 'phone', header: 'Phone', render: (row) => row.phone ?? '—' },
              { key: 'bookingsCount', header: 'Bookings', className: 'text-right' },
              { key: 'totalSpent', header: 'Total spent', className: 'text-right', render: (row) => formatMoney(row.totalSpent) },
              { key: 'lastVisit', header: 'Last visit', className: 'text-right', render: (row) => formatDate(row.lastVisit) },
            ]}
          />

          {bankingData && (
            <>
              <div>
                <h2 className="text-base font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Banking</h2>
                <div className="grid gap-4 sm:grid-cols-3">
                  <StatCard label="Total deposits" value={formatMoney(bankingData.summary.totalDeposits)} icon={ArrowDownToLine} />
                  <StatCard label="Total withdrawals" value={formatMoney(bankingData.summary.totalWithdrawals)} icon={ArrowUpFromLine} />
                  <StatCard label="Net bank movement" value={formatMoney(bankingData.summary.netMovement)} icon={Landmark} />
                </div>
              </div>

              <TableCard
                title="Bank account balances"
                data={bankingData.reconciliation}
                emptyMessage="No bank accounts configured yet."
                onExport={() =>
                  downloadCsv(
                    exportFilename('bank-accounts'),
                    [
                      { header: 'Account', value: (row) => row.accountName },
                      { header: 'Bank', value: (row) => row.bankName ?? '' },
                      { header: 'Account number', value: (row) => row.accountNumber ?? '' },
                      { header: 'Opening balance', value: (row) => Number(row.openingBalance).toFixed(2) },
                      { header: 'Period deposits', value: (row) => Number(row.periodDeposits).toFixed(2) },
                      { header: 'Period withdrawals', value: (row) => Number(row.periodWithdrawals).toFixed(2) },
                      { header: 'Current balance', value: (row) => Number(row.currentBalance).toFixed(2) },
                    ],
                    bankingData.reconciliation
                  )
                }
                columns={[
                  { key: 'accountName', header: 'Account' },
                  { key: 'bankName', header: 'Bank', render: (row) => row.bankName ?? '—' },
                  { key: 'accountNumber', header: 'Account no.', render: (row) => row.accountNumber ?? '—' },
                  { key: 'periodDeposits', header: 'Deposits', className: 'text-right tabular-nums text-green-700 dark:text-green-400', render: (row) => `+${formatMoney(row.periodDeposits)}` },
                  { key: 'periodWithdrawals', header: 'Withdrawals', className: 'text-right tabular-nums text-red-700 dark:text-red-400', render: (row) => `−${formatMoney(row.periodWithdrawals)}` },
                  { key: 'currentBalance', header: 'Balance', className: 'text-right tabular-nums font-semibold', render: (row) => <span className={row.currentBalance < 0 ? 'text-destructive' : ''}>{formatMoney(row.currentBalance)}</span> },
                ]}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}
