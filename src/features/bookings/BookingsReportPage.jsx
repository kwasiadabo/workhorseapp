import { useMemo, useState } from 'react';
import { format, startOfMonth, startOfYear, subDays } from 'date-fns';
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
import { Banknote, CalendarCheck, CheckCircle2, Clock, TrendingUp, XCircle } from 'lucide-react';

import PageHeader from '@/components/shared/PageHeader';
import DataTable from '@/components/shared/DataTable';
import StatCard from '@/components/shared/StatCard';
import { Card, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/dateFormat';
import { useBranches } from '@/features/branches/useBranches';
import { useBookingsReport } from '@/features/reports/useReports';

const PERIOD_PRESETS = {
  '7d': { label: 'Last 7 days', getRange: () => ({ startDate: subDays(new Date(), 6), endDate: new Date() }) },
  '30d': { label: 'Last 30 days', getRange: () => ({ startDate: subDays(new Date(), 29), endDate: new Date() }) },
  thisMonth: { label: 'This month', getRange: () => ({ startDate: startOfMonth(new Date()), endDate: new Date() }) },
  '90d': { label: 'Last 90 days', getRange: () => ({ startDate: subDays(new Date(), 89), endDate: new Date() }) },
  thisYear: { label: 'This year', getRange: () => ({ startDate: startOfYear(new Date()), endDate: new Date() }) },
};

const DEFAULT_PERIOD = '30d';

const STATUS_COLORS = {
  completed: 'var(--color-success)',
  confirmed: 'var(--color-info)',
  in_progress: 'var(--color-brand)',
  awaiting_payment: 'var(--color-chart-2)',
  cancelled: 'var(--color-destructive)',
  no_show: 'var(--color-chart-4)',
};

const formatMoney = (amount) => `GH¢ ${Number(amount ?? 0).toFixed(2)}`;
const formatLabel = (value = '') =>
  value.split('_').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');


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

export default function BookingsReportPage() {
  const [period, setPeriod] = useState(DEFAULT_PERIOD);
  const [branchFilter, setBranchFilter] = useState('all');

  const { data: branchesData } = useBranches({ limit: 100 });
  const branches = branchesData?.data ?? [];

  const params = useMemo(() => {
    const { startDate, endDate } = PERIOD_PRESETS[period].getRange();
    return {
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd'),
      branchId: branchFilter === 'all' ? undefined : branchFilter,
    };
  }, [period, branchFilter]);

  const { data, isLoading } = useBookingsReport(params);

  const bookingTrendData = (data?.bookingTrend ?? []).map((row) => {
    const [year, month] = row.month.split('-').map(Number);
    return { ...row, label: format(new Date(year, month - 1, 1), 'MMM yyyy') };
  });
  const hasTrend = bookingTrendData.some((row) => row.count > 0);

  const bookingsByStatus = (data?.bookingsByStatus ?? []).filter((row) => row.count > 0);
  const topServices = data?.topServices ?? [];
  const branchPerformance = data?.branchPerformance ?? [];
  const topStaff = data?.topStaff ?? [];
  const showBranchChart = branchPerformance.length > 1;

  const periodLabel = data
    ? `${formatDate(data.period.startDate)} – ${formatDate(data.period.endDate)}`
    : 'Booking analytics for your business.';

  return (
    <div className="space-y-8">
      <PageHeader
        title="Bookings Report"
        description={periodLabel}
        actions={
          <div className="flex flex-wrap gap-2">
            <Select value={branchFilter} onValueChange={setBranchFilter}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Branch">
                  {(value) => (value === 'all' ? 'All branches' : (branches.find((b) => b.id === value)?.name ?? 'Branch'))}
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
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Period">{(value) => PERIOD_PRESETS[value]?.label ?? 'Period'}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PERIOD_PRESETS).map(([value, preset]) => (
                  <SelectItem key={value} value={value}>
                    {preset.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      />

      {isLoading || !data ? (
        <div className="space-y-8">
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
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
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            <StatCard
              label="Total bookings"
              value={data.summary.totalBookings}
              icon={CalendarCheck}
            />
            <StatCard
              label="Completed"
              value={data.summary.completedBookings}
              icon={CheckCircle2}
              sub={`${data.summary.completionRate}% completion rate`}
            />
            <StatCard
              label="Completion rate"
              value={`${data.summary.completionRate}%`}
              icon={TrendingUp}
              sub={`${data.summary.completedBookings} of ${data.summary.totalBookings}`}
            />
            <StatCard
              label="Active"
              value={data.summary.inProgressBookings}
              icon={Clock}
              sub="Confirmed, in progress, awaiting payment"
            />
            <StatCard
              label="Cancelled / no-show"
              value={data.summary.cancelledBookings}
              icon={XCircle}
            />
            <StatCard
              label="Avg. booking value"
              value={formatMoney(data.summary.avgBookingValue)}
              icon={Banknote}
              sub="Completed bookings only"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="Booking trend (last 6 months)" isEmpty={!hasTrend} emptyMessage="No bookings recorded yet.">
              <BarChart data={bookingTrendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip
                  formatter={(value, name, item) => [
                    `${value} total (${item.payload.completedCount} completed)`,
                    'Bookings',
                  ]}
                />
                <Bar dataKey="count" fill="var(--color-brand)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartCard>

            <ChartCard
              title="Bookings by status"
              isEmpty={bookingsByStatus.length === 0}
              emptyMessage="No bookings in this period."
            >
              <PieChart>
                <Pie
                  data={bookingsByStatus}
                  dataKey="count"
                  nameKey="status"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {bookingsByStatus.map((entry) => (
                    <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? 'var(--color-chart-1)'} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [value, formatLabel(name)]} />
              </PieChart>
            </ChartCard>
          </div>

          {topServices.length > 0 && (
            <ChartCard title="Top services by bookings" isEmpty={false} emptyMessage="">
              <BarChart data={topServices.slice(0, 10)} layout="vertical" margin={{ left: 24 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={130} />
                <Tooltip
                  formatter={(value, _name, item) => [
                    `${value} bookings (${formatMoney(item.payload.revenue)})`,
                    'Service',
                  ]}
                />
                <Bar dataKey="bookingsCount" fill="var(--color-chart-1)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ChartCard>
          )}

          {showBranchChart && (
            <ChartCard title="Bookings by branch" isEmpty={false} emptyMessage="">
              <BarChart data={branchPerformance}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="branchName" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip
                  formatter={(value, _name, item) => [
                    `${value} bookings (${item.payload.completedCount} completed)`,
                    'Branch',
                  ]}
                />
                <Bar dataKey="bookingsCount" fill="var(--color-chart-2)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartCard>
          )}

          <Card className="gap-3 p-5">
            <CardTitle>Branch performance</CardTitle>
            <DataTable
              columns={[
                { key: 'branchName', header: 'Branch' },
                { key: 'bookingsCount', header: 'Total', className: 'text-right' },
                { key: 'completedCount', header: 'Completed', className: 'text-right' },
                {
                  key: 'cancelledCount',
                  header: 'Cancelled / no-show',
                  className: 'text-right',
                },
                {
                  key: 'revenue',
                  header: 'Revenue',
                  className: 'text-right',
                  render: (row) => formatMoney(row.revenue),
                },
              ]}
              data={branchPerformance}
              emptyMessage="No bookings in this period."
            />
          </Card>

          {topStaff.length > 0 && (
            <Card className="gap-3 p-5">
              <CardTitle>Top service providers</CardTitle>
              <DataTable
                columns={[
                  { key: 'name', header: 'Name' },
                  { key: 'branchName', header: 'Branch' },
                  { key: 'servicesAssigned', header: 'Assigned', className: 'text-right' },
                  { key: 'completedCount', header: 'Completed', className: 'text-right' },
                  {
                    key: 'completionRate',
                    header: 'Completion rate',
                    className: 'text-right',
                    render: (row) =>
                      row.servicesAssigned > 0
                        ? `${Math.round((row.completedCount / row.servicesAssigned) * 100)}%`
                        : '—',
                  },
                ]}
                data={topStaff}
                emptyMessage="No staff assignments in this period."
              />
            </Card>
          )}
        </>
      )}
    </div>
  );
}
