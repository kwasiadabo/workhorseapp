import { useMemo, useState } from 'react';
import {
  format,
  startOfMonth,
  startOfYear,
  subDays,
  subMonths,
  startOfDay,
  differenceInDays,
} from 'date-fns';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Calculator, Hash, TrendingUp, Wallet } from 'lucide-react';

import PageHeader from '@/components/shared/PageHeader';
import DataTable from '@/components/shared/DataTable';
import StatCard from '@/components/shared/StatCard';
import { Card, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useBranches } from '@/features/branches/useBranches';
import { useRevenueReport } from './useReports';

// ─── Constants ───────────────────────────────────────────────────────────────

const PERIOD_PRESETS = {
  '7d': { label: 'Last 7 days', getRange: () => ({ startDate: subDays(new Date(), 6), endDate: new Date() }) },
  '30d': { label: 'Last 30 days', getRange: () => ({ startDate: subDays(new Date(), 29), endDate: new Date() }) },
  thisMonth: { label: 'This month', getRange: () => ({ startDate: startOfMonth(new Date()), endDate: new Date() }) },
  '90d': { label: 'Last 90 days', getRange: () => ({ startDate: subDays(new Date(), 89), endDate: new Date() }) },
  '6m': { label: 'Last 6 months', getRange: () => ({ startDate: subMonths(new Date(), 6), endDate: new Date() }) },
  thisYear: { label: 'This year', getRange: () => ({ startDate: startOfYear(new Date()), endDate: new Date() }) },
  custom: { label: 'Custom range', getRange: null },
};

const DEFAULT_PERIOD = '30d';

const GRANULARITY_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

const AUTO_GRANULARITY = (days) => {
  if (days <= 14) return 'daily';
  if (days <= 90) return 'weekly';
  if (days <= 365) return 'monthly';
  return 'yearly';
};

const BRANCH_COLORS = [
  'var(--color-chart-1)',
  'var(--color-chart-2)',
  'var(--color-chart-3)',
  'var(--color-brand)',
  'var(--color-info)',
];

const METHOD_COLORS = [
  'var(--color-chart-1)',
  'var(--color-chart-2)',
  'var(--color-chart-3)',
  'var(--color-brand)',
  'var(--color-info)',
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatMoney = (v) => `GH¢ ${Number(v ?? 0).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatLabel = (v = '') =>
  v.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

const toDateInput = (d) => format(d, 'yyyy-MM-dd');

// ─── Sub-components ──────────────────────────────────────────────────────────

function ChartCard({ title, isEmpty, emptyMessage = 'No data for this period.', children, className = '' }) {
  return (
    <Card className={`gap-3 p-5 ${className}`}>
      <CardTitle>{title}</CardTitle>
      <div className="h-64">
        {isEmpty ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {children}
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RevenueReportPage() {
  const [period, setPeriod] = useState(DEFAULT_PERIOD);
  const [customStart, setCustomStart] = useState(toDateInput(subDays(new Date(), 29)));
  const [customEnd, setCustomEnd] = useState(toDateInput(new Date()));
  const [branchFilter, setBranchFilter] = useState('all');
  const [granularity, setGranularity] = useState(null); // null = auto

  const { data: branchesData } = useBranches({ limit: 100 });
  const branches = branchesData?.data ?? [];

  const dateRange = useMemo(() => {
    if (period === 'custom') {
      return {
        startDate: customStart ? new Date(customStart) : subDays(new Date(), 29),
        endDate: customEnd ? new Date(customEnd) : new Date(),
      };
    }
    return PERIOD_PRESETS[period].getRange();
  }, [period, customStart, customEnd]);

  const daySpan = differenceInDays(dateRange.endDate, dateRange.startDate) + 1;
  const effectiveGranularity = granularity ?? AUTO_GRANULARITY(daySpan);

  const params = useMemo(
    () => ({
      startDate: toDateInput(dateRange.startDate),
      endDate: toDateInput(dateRange.endDate),
      granularity: effectiveGranularity,
      branchId: branchFilter === 'all' ? undefined : branchFilter,
    }),
    [dateRange, effectiveGranularity, branchFilter]
  );

  const { data, isLoading } = useRevenueReport(params);

  const timeSeries = data?.timeSeries ?? [];
  const byBranch = data?.byBranch ?? [];
  const byMethod = data?.byMethod ?? [];

  const hasData = timeSeries.some((r) => r.total > 0);

  // Merge branch time-series into one array per period for the multi-line chart.
  // Top 5 branches to keep the chart readable.
  const topBranches = byBranch.slice(0, 5);
  const branchChartData = useMemo(() => {
    if (!topBranches.length) return [];
    const periodMap = new Map(timeSeries.map((r) => [r.period, { period: r.period, label: r.label }]));
    topBranches.forEach((branch) => {
      branch.timeSeries.forEach((row) => {
        const entry = periodMap.get(row.period);
        if (entry) entry[branch.branchName] = row.total;
      });
    });
    return [...periodMap.values()];
  }, [topBranches, timeSeries]);

  const handlePeriodChange = (val) => {
    setPeriod(val);
    setGranularity(null); // reset to auto on period change
  };

  return (
    <div className="space-y-8">
      {/* Header & Controls */}
      <PageHeader
        title="Revenue Report"
        description="Analyse revenue trends across time periods and branches."
        actions={
          <div className="flex flex-wrap items-end gap-2">
            <Select value={branchFilter} onValueChange={setBranchFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All branches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All branches</SelectItem>
                {branches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={period} onValueChange={handlePeriodChange}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PERIOD_PRESETS).map(([value, preset]) => (
                  <SelectItem key={value} value={value}>
                    {preset.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={effectiveGranularity} onValueChange={setGranularity}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Granularity" />
              </SelectTrigger>
              <SelectContent>
                {GRANULARITY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                    {opt.value === AUTO_GRANULARITY(daySpan) && granularity === null ? ' (auto)' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      />

      {/* Custom date inputs */}
      {period === 'custom' && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">From</label>
            <Input
              type="date"
              value={customStart}
              max={customEnd}
              onChange={(e) => setCustomStart(e.target.value)}
              className="w-40"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">To</label>
            <Input
              type="date"
              value={customEnd}
              min={customStart}
              max={toDateInput(new Date())}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="w-40"
            />
          </div>
        </div>
      )}

      {/* Loading skeletons */}
      {isLoading && !data ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-72" />)}
          </div>
        </div>
      ) : (
        <>
          {/* KPI cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              label="Total revenue"
              value={formatMoney(data?.summary.totalRevenue)}
              icon={Wallet}
            />
            <StatCard
              label="Transactions"
              value={(data?.summary.txCount ?? 0).toLocaleString()}
              icon={Hash}
            />
            <StatCard
              label="Avg. per transaction"
              value={formatMoney(data?.summary.avgPayment)}
              icon={Calculator}
              sub="completed payments"
            />
          </div>

          {/* Revenue trend – area chart */}
          <ChartCard
            title={`Revenue trend — ${GRANULARITY_OPTIONS.find((g) => g.value === effectiveGranularity)?.label}`}
            isEmpty={!hasData}
            className="lg:col-span-2"
          >
            <AreaChart data={timeSeries} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-success)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="var(--color-success)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11 }}
                interval="preserveStartEnd"
              />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                formatter={(value, _name, item) => [
                  `${formatMoney(value)} (${item.payload.count} txn)`,
                  'Revenue',
                ]}
              />
              <Area
                type="monotone"
                dataKey="total"
                stroke="var(--color-success)"
                strokeWidth={2}
                fill="url(#revGrad)"
                dot={timeSeries.length <= 20}
              />
            </AreaChart>
          </ChartCard>

          {/* Branch comparison – stacked or multi-line */}
          {topBranches.length > 1 && (
            <ChartCard
              title={`Revenue by branch — ${GRANULARITY_OPTIONS.find((g) => g.value === effectiveGranularity)?.label}`}
              isEmpty={false}
            >
              <LineChart data={branchChartData} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip formatter={(value) => formatMoney(value)} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {topBranches.map((branch, i) => (
                  <Line
                    key={branch.branchId}
                    type="monotone"
                    dataKey={branch.branchName}
                    stroke={BRANCH_COLORS[i % BRANCH_COLORS.length]}
                    strokeWidth={2}
                    dot={false}
                  />
                ))}
              </LineChart>
            </ChartCard>
          )}

          {/* Bottom row: by-branch bar + by-method pie */}
          <div className="grid gap-4 lg:grid-cols-2">
            {byBranch.length > 0 && (
              <ChartCard title="Revenue by branch (period total)" isEmpty={false}>
                <BarChart data={byBranch} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="branchName" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    formatter={(value, _name, item) => [
                      `${formatMoney(value)} (${item.payload.count} txn)`,
                      'Revenue',
                    ]}
                  />
                  <Bar dataKey="total" fill="var(--color-chart-3)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartCard>
            )}

            <ChartCard
              title="Revenue by payment method"
              isEmpty={byMethod.length === 0}
            >
              <PieChart>
                <Pie
                  data={byMethod}
                  dataKey="total"
                  nameKey="method"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={2}
                >
                  {byMethod.map((entry, i) => (
                    <Cell key={entry.method} fill={METHOD_COLORS[i % METHOD_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [formatMoney(value), formatLabel(name)]} />
                <Legend
                  formatter={(value) => formatLabel(value)}
                  wrapperStyle={{ fontSize: 12 }}
                />
              </PieChart>
            </ChartCard>
          </div>

          {/* Branch summary table */}
          {byBranch.length > 0 && (
            <Card className="gap-3 p-5">
              <CardTitle>Branch revenue breakdown</CardTitle>
              <DataTable
                columns={[
                  { key: 'branchName', header: 'Branch' },
                  {
                    key: 'count',
                    header: 'Transactions',
                    className: 'text-right',
                  },
                  {
                    key: 'total',
                    header: 'Revenue',
                    className: 'text-right font-medium',
                    render: (row) => formatMoney(row.total),
                  },
                  {
                    key: 'avg',
                    header: 'Avg. per txn',
                    className: 'text-right',
                    render: (row) => formatMoney(row.count > 0 ? row.total / row.count : 0),
                  },
                  {
                    key: 'share',
                    header: '% of total',
                    className: 'text-right',
                    render: (row) => {
                      const pct =
                        data?.summary.totalRevenue > 0
                          ? (row.total / data.summary.totalRevenue) * 100
                          : 0;
                      return `${pct.toFixed(1)}%`;
                    },
                  },
                ]}
                data={byBranch}
                emptyMessage="No branch data for this period."
              />
            </Card>
          )}

          {/* Payment method table */}
          {byMethod.length > 0 && (
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
                    header: 'Revenue',
                    className: 'text-right font-medium',
                    render: (row) => formatMoney(row.total),
                  },
                  {
                    key: 'avg',
                    header: 'Avg. per txn',
                    className: 'text-right',
                    render: (row) => formatMoney(row.count > 0 ? row.total / row.count : 0),
                  },
                ]}
                data={byMethod}
                emptyMessage="No payments in this period."
              />
            </Card>
          )}
        </>
      )}
    </div>
  );
}
