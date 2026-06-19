import { useMemo, useState } from 'react';
import { format, startOfMonth, subDays, subMonths, startOfYear } from 'date-fns';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Percent, TrendingUp, Users } from 'lucide-react';

import PageHeader from '@/components/shared/PageHeader';
import DataTable from '@/components/shared/DataTable';
import { Card, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useBranches } from '@/features/branches/useBranches';
import { useCommissionReport } from './useReports';

const PERIOD_PRESETS = {
  thisMonth: { label: 'This month', getRange: () => ({ startDate: startOfMonth(new Date()), endDate: new Date() }) },
  '30d': { label: 'Last 30 days', getRange: () => ({ startDate: subDays(new Date(), 29), endDate: new Date() }) },
  '90d': { label: 'Last 90 days', getRange: () => ({ startDate: subDays(new Date(), 89), endDate: new Date() }) },
  '6m': { label: 'Last 6 months', getRange: () => ({ startDate: subMonths(new Date(), 6), endDate: new Date() }) },
  thisYear: { label: 'This year', getRange: () => ({ startDate: startOfYear(new Date()), endDate: new Date() }) },
};

const fmt = (n) =>
  Number(n).toLocaleString('en-GH', { style: 'currency', currency: 'GHS', maximumFractionDigits: 2 });

const COLUMNS = [
  { key: 'employeeName', header: 'Employee' },
  { key: 'branch', header: 'Branch' },
  {
    key: 'commissionRate',
    header: 'Rate (%)',
    render: (row) => (row.commissionRate != null ? `${Number(row.commissionRate).toFixed(1)}%` : '—'),
  },
  {
    key: 'serviceRevenue',
    header: 'Service revenue',
    render: (row) => fmt(row.serviceRevenue ?? 0),
  },
  {
    key: 'commissionEarned',
    header: 'Commission earned',
    render: (row) => fmt(row.commissionEarned ?? 0),
  },
];

function StatCard({ icon: Icon, label, value, loading }) {
  return (
    <Card className="flex items-center gap-4 p-4">
      <div className="bg-muted rounded-lg p-2">
        <Icon className="text-muted-foreground size-5" />
      </div>
      <div>
        <p className="text-muted-foreground text-xs">{label}</p>
        {loading ? <Skeleton className="mt-1 h-6 w-28" /> : <p className="text-xl font-semibold">{value}</p>}
      </div>
    </Card>
  );
}

export default function CommissionReportPage() {
  const [period, setPeriod] = useState('thisMonth');
  const [branchId, setBranchId] = useState('');

  const range = useMemo(() => PERIOD_PRESETS[period].getRange(), [period]);

  const params = useMemo(
    () => ({
      startDate: format(range.startDate, 'yyyy-MM-dd'),
      endDate: format(range.endDate, 'yyyy-MM-dd'),
      ...(branchId ? { branchId } : {}),
    }),
    [range, branchId],
  );

  const { data, isLoading } = useCommissionReport(params);
  const { data: branchesData } = useBranches({ limit: 100 });
  const branches = branchesData?.data ?? [];

  const summary = data?.summary ?? {};
  const employees = data?.employees ?? [];

  const chartData = useMemo(
    () =>
      employees
        .filter((e) => Number(e.commissionEarned) > 0)
        .map((e) => ({
          name: e.employeeName,
          commission: Number(e.commissionEarned),
          revenue: Number(e.serviceRevenue),
        }))
        .sort((a, b) => b.commission - a.commission)
        .slice(0, 10),
    [employees],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Commission Report"
        description="Service revenue and commission earned per staff member"
      />

      <div className="flex flex-wrap gap-3">
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(PERIOD_PRESETS).map(([key, { label }]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={branchId} onValueChange={setBranchId}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All branches" />
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
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={TrendingUp}
          label="Total service revenue"
          value={fmt(summary.totalServiceRevenue ?? 0)}
          loading={isLoading}
        />
        <StatCard
          icon={Percent}
          label="Total commission"
          value={fmt(summary.totalCommission ?? 0)}
          loading={isLoading}
        />
        <StatCard
          icon={Users}
          label="Staff with earnings"
          value={employees.filter((e) => Number(e.commissionEarned) > 0).length}
          loading={isLoading}
        />
      </div>

      {chartData.length > 0 && (
        <Card className="p-4">
          <CardTitle className="mb-4 text-sm font-medium">Commission by staff (top 10)</CardTitle>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(value, name) => [fmt(value), name === 'commission' ? 'Commission' : 'Revenue']}
              />
              <Bar dataKey="revenue" fill="var(--color-chart-2)" radius={[3, 3, 0, 0]} name="revenue" />
              <Bar dataKey="commission" fill="var(--color-chart-1)" radius={[3, 3, 0, 0]} name="commission" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      <Card className="p-0 overflow-hidden">
        <DataTable
          columns={COLUMNS}
          data={employees}
          isLoading={isLoading}
          emptyMessage="No commission data for this period."
        />
      </Card>
    </div>
  );
}
