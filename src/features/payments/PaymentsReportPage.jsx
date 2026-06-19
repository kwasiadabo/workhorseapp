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
import { Calculator, Hash, Wallet } from 'lucide-react';

import PageHeader from '@/components/shared/PageHeader';
import DataTable from '@/components/shared/DataTable';
import StatCard from '@/components/shared/StatCard';
import { Card, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/dateFormat';
import { useBranches } from '@/features/branches/useBranches';
import { usePaymentsReport } from '@/features/reports/useReports';

const PERIOD_PRESETS = {
  '7d': { label: 'Last 7 days', getRange: () => ({ startDate: subDays(new Date(), 6), endDate: new Date() }) },
  '30d': { label: 'Last 30 days', getRange: () => ({ startDate: subDays(new Date(), 29), endDate: new Date() }) },
  thisMonth: { label: 'This month', getRange: () => ({ startDate: startOfMonth(new Date()), endDate: new Date() }) },
  '90d': { label: 'Last 90 days', getRange: () => ({ startDate: subDays(new Date(), 89), endDate: new Date() }) },
  thisYear: { label: 'This year', getRange: () => ({ startDate: startOfYear(new Date()), endDate: new Date() }) },
};

const DEFAULT_PERIOD = '30d';

const METHOD_COLORS = [
  'var(--color-chart-1)',
  'var(--color-chart-2)',
  'var(--color-chart-3)',
  'var(--color-brand)',
  'var(--color-info)',
];

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

export default function PaymentsReportPage() {
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

  const { data, isLoading } = usePaymentsReport(params);

  const revenueTrendData = (data?.revenueTrend ?? []).map((row) => {
    const [year, month] = row.month.split('-').map(Number);
    return { ...row, label: format(new Date(year, month - 1, 1), 'MMM yyyy') };
  });
  const hasTrend = revenueTrendData.some((row) => row.total > 0);

  const byMethod = data?.byMethod ?? [];
  const byBranch = data?.byBranch ?? [];
  const topCustomers = data?.topCustomers ?? [];
  const showBranchChart = byBranch.length > 1;

  const periodLabel = data
    ? `${formatDate(data.period.startDate)} – ${formatDate(data.period.endDate)}`
    : 'Payment analytics for your business.';

  return (
    <div className="space-y-8">
      <PageHeader
        title="Payments Report"
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
          <div className="grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
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
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              label="Total revenue"
              value={formatMoney(data.summary.totalRevenue)}
              icon={Wallet}
            />
            <StatCard
              label="Payments"
              value={data.summary.paymentCount}
              icon={Hash}
            />
            <StatCard
              label="Avg. payment"
              value={formatMoney(data.summary.avgPayment)}
              icon={Calculator}
              sub="per transaction"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="Revenue trend (last 6 months)" isEmpty={!hasTrend} emptyMessage="No payments recorded yet.">
              <BarChart data={revenueTrendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip
                  formatter={(value, _name, item) => [
                    `${formatMoney(value)} (${item.payload.count} payments)`,
                    'Revenue',
                  ]}
                />
                <Bar dataKey="total" fill="var(--color-success)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartCard>

            <ChartCard
              title="Revenue by payment method"
              isEmpty={byMethod.length === 0}
              emptyMessage="No payments in this period."
            >
              <PieChart>
                <Pie
                  data={byMethod}
                  dataKey="total"
                  nameKey="method"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {byMethod.map((entry, index) => (
                    <Cell key={entry.method} fill={METHOD_COLORS[index % METHOD_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [formatMoney(value), formatLabel(name)]} />
              </PieChart>
            </ChartCard>
          </div>

          {showBranchChart && (
            <ChartCard title="Revenue by branch" isEmpty={false} emptyMessage="">
              <BarChart data={byBranch}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="branchName" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip
                  formatter={(value, _name, item) => [
                    `${formatMoney(value)} (${item.payload.count} payments)`,
                    'Revenue',
                  ]}
                />
                <Bar dataKey="total" fill="var(--color-chart-3)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartCard>
          )}

          <Card className="gap-3 p-5">
            <CardTitle>Payment method breakdown</CardTitle>
            <DataTable
              columns={[
                {
                  key: 'method',
                  header: 'Method',
                  render: (row) => formatLabel(row.method),
                },
                { key: 'count', header: 'Transactions', className: 'text-right' },
                {
                  key: 'total',
                  header: 'Total',
                  className: 'text-right',
                  render: (row) => formatMoney(row.total),
                },
                {
                  key: 'avg',
                  header: 'Avg. per transaction',
                  className: 'text-right',
                  render: (row) => formatMoney(row.count > 0 ? row.total / row.count : 0),
                },
              ]}
              data={byMethod}
              emptyMessage="No payments in this period."
            />
          </Card>

          {topCustomers.length > 0 && (
            <Card className="gap-3 p-5">
              <CardTitle>Top clients by spend</CardTitle>
              <DataTable
                columns={[
                  { key: 'name', header: 'Name' },
                  { key: 'phone', header: 'Phone' },
                  { key: 'paymentCount', header: 'Payments', className: 'text-right' },
                  {
                    key: 'totalSpent',
                    header: 'Total spent',
                    className: 'text-right',
                    render: (row) => formatMoney(row.totalSpent),
                  },
                ]}
                data={topCustomers}
                emptyMessage="No customers in this period."
              />
            </Card>
          )}
        </>
      )}
    </div>
  );
}
